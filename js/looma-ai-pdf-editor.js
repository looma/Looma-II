/*
 * Lightweight PDF annotation editor for the AI page.
 *
 * Render: PDF.js draws the chosen page onto a canvas at a user-friendly size.
 * Edit:   we keep a per-page list of annotation objects (text, redact rect,
 *         highlight rect, strikethrough line) layered over the canvas as
 *         absolutely-positioned divs, so the user can move-cancel on the fly.
 * Save:   we walk every page through pdf-lib, drawing each annotation in the
 *         page's *PDF coordinate space* (origin bottom-left), then POST the
 *         resulting bytes through the existing /replace_pdf endpoint, which
 *         keeps the previous file as a numbered backup.
 *
 * The annotation model purposely stores all coordinates in PDF user-space
 * (points), not pixels, so re-rendering at a different DPI doesn't shift them.
 */
(function () {
  'use strict';

  // The pdfjsLib global is exposed by pdf.min.js. We need a worker; reuse the
  // worker that ships next to pdf.min.js.
  if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdfjs/pdf.worker.min.js';
  }

  var state = {
    chapterId: null,
    grade: null,
    subject: null,
    language: null,
    sourceUrl: null,         // PDF URL to load (relative to web root)
    pdfDoc: null,            // pdfjs document
    pageNum: 1,
    pageCount: 0,
    pageSizes: [],           // [{w, h}] in PDF points, 1-indexed at +1
    annotations: [],         // [{page, kind, x, y, w, h, text, color, size, x2, y2}]
    history: [],             // stack of {action: 'add', ann} for undo
    tool: 'select',
    color: '#1a73e8',
    size: 14,
    scale: 1,
    rendering: false,
    drag: null,              // {start:{x,y}, kind, color, size}
  };

  var els = {};

  function $(sel) { return document.querySelector(sel); }
  function setStatus(msg, isErr) {
    var s = els.status;
    if (!s) return;
    s.textContent = msg || '';
    s.style.color = isErr ? '#b00020' : '';
  }

  // Convert PDF.js page coords (origin bottom-left, y up) <-> overlay px.
  // pdfY = pageHeight_pts - canvasY_pts; overlay/canvas use top-left origin.
  function ptsToCanvas(p) {
    return { x: p.x * state.scale, y: p.y * state.scale };
  }
  function canvasToPts(p) {
    return { x: p.x / state.scale, y: p.y / state.scale };
  }

  function open(ctx) {
    state.chapterId = ctx.chapterId || null;
    state.grade     = ctx.grade     || null;
    state.subject   = ctx.subject   || null;
    state.language  = ctx.language  || null;
    state.sourceUrl = ctx.sourceUrl || null;
    state.annotations = [];
    state.history = [];
    state.pageNum = 1;

    if (!els.modal) cacheElements();
    els.info.textContent = state.chapterId ? ('Chapter ' + state.chapterId) : '';
    els.modal.style.display = 'flex';
    setActiveTool('select');
    loadPdf();
  }
  function close() {
    if (!els.modal) return;
    els.modal.style.display = 'none';
    state.pdfDoc = null;
    if (els.canvas) {
      var ctx = els.canvas.getContext('2d');
      ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
    }
    if (els.overlay) els.overlay.innerHTML = '';
  }

  function cacheElements() {
    els.modal     = $('#ai-pdf-editor-modal');
    els.info      = $('#ai-pdf-editor-info');
    els.status    = $('#ai-pdf-editor-status');
    els.canvas    = $('#ai-pdf-canvas');
    els.overlay   = $('#ai-pdf-overlay');
    els.pageWrap  = $('#ai-pdf-page-wrap');
    els.pageInfo  = $('#ai-pdf-page-info');
    els.colorIn   = $('#ai-pdf-color');
    els.sizeIn    = $('#ai-pdf-size');

    $('#ai-pdf-editor-close').addEventListener('click', close);
    $('#ai-pdf-prev').addEventListener('click', function () { goToPage(state.pageNum - 1); });
    $('#ai-pdf-next').addEventListener('click', function () { goToPage(state.pageNum + 1); });
    $('#ai-pdf-undo').addEventListener('click', undo);
    $('#ai-pdf-clear').addEventListener('click', clearPage);
    $('#ai-pdf-save').addEventListener('click', save);

    Array.prototype.forEach.call(document.querySelectorAll('.ai-pdf-tool'), function (b) {
      b.addEventListener('click', function () { setActiveTool(b.getAttribute('data-tool')); });
    });
    els.colorIn.addEventListener('input', function () { state.color = els.colorIn.value; });
    els.sizeIn.addEventListener('input',  function () {
      var n = Number(els.sizeIn.value); if (!isFinite(n)) n = 14;
      state.size = Math.max(6, Math.min(72, n));
    });

    // Overlay interactions — drag to draw rectangles/lines, click to add text or delete.
    els.overlay.addEventListener('mousedown', onOverlayDown);
    els.overlay.addEventListener('mousemove', onOverlayMove);
    els.overlay.addEventListener('mouseup',   onOverlayUp);
    els.overlay.addEventListener('mouseleave', onOverlayUp);

    document.addEventListener('keydown', function (e) {
      if (els.modal.style.display === 'none') return;
      if (e.key === 'Escape') close();
      if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); }
    });
  }

  function setActiveTool(tool) {
    state.tool = tool || 'select';
    Array.prototype.forEach.call(document.querySelectorAll('.ai-pdf-tool'), function (b) {
      b.classList.toggle('ai-pdf-tool-active', b.getAttribute('data-tool') === state.tool);
      b.style.outline = (b.getAttribute('data-tool') === state.tool) ? '2px solid #1a73e8' : '';
    });
    els.overlay.style.cursor = (state.tool === 'select') ? 'pointer' : 'crosshair';
  }

  async function loadPdf() {
    setStatus('Loading PDF...');
    try {
      var url = state.sourceUrl;
      if (!url) throw new Error('No PDF URL for this chapter');
      var loadingTask = window.pdfjsLib.getDocument({ url: url });
      state.pdfDoc = await loadingTask.promise;
      state.pageCount = state.pdfDoc.numPages;
      state.pageSizes = new Array(state.pageCount + 1);
      els.pageInfo.textContent = 'Page ' + state.pageNum + ' / ' + state.pageCount;
      await renderPage(state.pageNum);
      setStatus('Loaded.');
    } catch (e) {
      setStatus('Could not load PDF: ' + (e && e.message ? e.message : e), true);
    }
  }

  async function goToPage(n) {
    if (state.rendering) return;
    if (n < 1 || n > state.pageCount) return;
    state.pageNum = n;
    await renderPage(n);
  }

  async function renderPage(num) {
    if (!state.pdfDoc) return;
    state.rendering = true;
    try {
      var page = await state.pdfDoc.getPage(num);
      // Render at a comfortable on-screen size — fit width to viewport, capped.
      var viewportPts = page.getViewport({ scale: 1 });
      state.pageSizes[num] = { w: viewportPts.width, h: viewportPts.height };

      var stage = document.getElementById('ai-pdf-editor-stage');
      var maxW = Math.max(400, (stage.clientWidth || 800) - 36);
      var scale = Math.min(2.0, maxW / viewportPts.width);
      state.scale = scale;

      var viewport = page.getViewport({ scale: scale });
      var canvas = els.canvas;
      var dpr = window.devicePixelRatio || 1;
      canvas.width  = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width  = viewport.width  + 'px';
      canvas.style.height = viewport.height + 'px';
      els.pageWrap.style.width  = viewport.width  + 'px';
      els.pageWrap.style.height = viewport.height + 'px';

      var ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, viewport.width, viewport.height);
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;

      els.pageInfo.textContent = 'Page ' + num + ' / ' + state.pageCount;
      drawOverlayForCurrentPage();
    } finally {
      state.rendering = false;
    }
  }

  function drawOverlayForCurrentPage() {
    els.overlay.innerHTML = '';
    var anns = state.annotations.filter(function (a) { return a.page === state.pageNum; });
    anns.forEach(function (a, i) {
      var node = renderAnnotationNode(a, i);
      if (node) els.overlay.appendChild(node);
    });
  }

  function renderAnnotationNode(a, idx) {
    var d = document.createElement('div');
    d.dataset.annIdx = String(idx);
    d.style.position = 'absolute';
    d.style.boxSizing = 'border-box';
    if (a.kind === 'redact') {
      var p = ptsToCanvas({ x: a.x, y: a.y });
      d.style.left = p.x + 'px';
      d.style.top  = p.y + 'px';
      d.style.width  = (a.w * state.scale) + 'px';
      d.style.height = (a.h * state.scale) + 'px';
      d.style.background = a.color || '#ffffff';
      d.style.border = '1px dashed rgba(0,0,0,0.4)';
      d.title = 'Redact box (click in Select tool to delete)';
    } else if (a.kind === 'highlight') {
      var p2 = ptsToCanvas({ x: a.x, y: a.y });
      d.style.left = p2.x + 'px';
      d.style.top  = p2.y + 'px';
      d.style.width  = (a.w * state.scale) + 'px';
      d.style.height = (a.h * state.scale) + 'px';
      d.style.background = (a.color || '#ffe066') + '80'; // ~50% alpha
      d.title = 'Highlight';
    } else if (a.kind === 'strike') {
      var p3 = ptsToCanvas({ x: a.x, y: a.y });
      d.style.left = p3.x + 'px';
      d.style.top  = p3.y + 'px';
      d.style.width  = (a.w * state.scale) + 'px';
      d.style.height = '0';
      d.style.borderTop = '2px solid ' + (a.color || '#b00020');
      d.title = 'Strikethrough';
    } else if (a.kind === 'text') {
      var p4 = ptsToCanvas({ x: a.x, y: a.y - a.size }); // y was the baseline
      d.style.left = p4.x + 'px';
      d.style.top  = p4.y + 'px';
      d.style.color = a.color || '#1a73e8';
      d.style.font = (a.size * state.scale).toFixed(1) + 'px sans-serif';
      d.style.whiteSpace = 'pre';
      d.style.padding = '0';
      d.style.lineHeight = '1';
      d.textContent = a.text || '';
      d.title = 'Text';
    } else {
      return null;
    }
    if (state.tool === 'select') {
      d.style.cursor = 'pointer';
      d.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var ix = state.annotations.indexOf(a);
        if (ix >= 0) {
          state.history.push({ action: 'remove', ann: a, atIndex: ix });
          state.annotations.splice(ix, 1);
          drawOverlayForCurrentPage();
        }
      });
    } else {
      d.style.pointerEvents = 'none';
    }
    return d;
  }

  function localXY(ev) {
    var rect = els.overlay.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }

  function onOverlayDown(ev) {
    if (state.tool === 'select') return;
    if (state.tool === 'text') return; // handled on click in mouseup
    var p = localXY(ev);
    state.drag = { startCanvas: p, lastCanvas: p, kind: state.tool };
    var preview = document.createElement('div');
    preview.id = 'ai-pdf-drag-preview';
    preview.style.position = 'absolute';
    preview.style.pointerEvents = 'none';
    preview.style.boxSizing = 'border-box';
    preview.style.border = '1px dashed #1a73e8';
    if (state.tool === 'redact') preview.style.background = '#ffffffcc';
    else if (state.tool === 'highlight') preview.style.background = (state.color || '#ffe066') + '80';
    els.overlay.appendChild(preview);
  }

  function onOverlayMove(ev) {
    if (!state.drag) return;
    var p = localXY(ev);
    state.drag.lastCanvas = p;
    var prev = document.getElementById('ai-pdf-drag-preview');
    if (!prev) return;
    var x = Math.min(state.drag.startCanvas.x, p.x);
    var y = Math.min(state.drag.startCanvas.y, p.y);
    var w = Math.abs(p.x - state.drag.startCanvas.x);
    var h = Math.abs(p.y - state.drag.startCanvas.y);
    if (state.tool === 'strike') {
      // Show a single line preview from start to current.
      prev.style.left = state.drag.startCanvas.x + 'px';
      prev.style.top  = state.drag.startCanvas.y + 'px';
      prev.style.width  = (p.x - state.drag.startCanvas.x) + 'px';
      prev.style.height = '0';
      prev.style.border = 'none';
      prev.style.borderTop = '2px solid ' + (state.color || '#b00020');
    } else {
      prev.style.left = x + 'px'; prev.style.top  = y + 'px';
      prev.style.width  = w + 'px'; prev.style.height = h + 'px';
    }
  }

  function onOverlayUp(ev) {
    // Text tool: place caret on click.
    if (state.tool === 'text' && ev && ev.type === 'mouseup') {
      var p = localXY(ev);
      var pts = canvasToPts(p);
      var text = window.prompt('Text to add:');
      if (text != null && text !== '') {
        var ann = {
          page: state.pageNum, kind: 'text',
          x: pts.x, y: pts.y, // y is the baseline-ish in canvas coords
          text: text, color: state.color, size: state.size,
        };
        state.annotations.push(ann);
        state.history.push({ action: 'add', ann: ann });
        drawOverlayForCurrentPage();
      }
      return;
    }
    if (!state.drag) return;
    var prev = document.getElementById('ai-pdf-drag-preview');
    if (prev) prev.remove();
    var s = state.drag.startCanvas, eC = state.drag.lastCanvas;
    state.drag = null;
    var canvasX = Math.min(s.x, eC.x), canvasY = Math.min(s.y, eC.y);
    var canvasW = Math.abs(eC.x - s.x), canvasH = Math.abs(eC.y - s.y);
    if (state.tool !== 'strike' && (canvasW < 4 || canvasH < 4)) return;
    if (state.tool === 'strike' && Math.abs(eC.x - s.x) < 6) return;

    var topLeftPts     = canvasToPts({ x: canvasX, y: canvasY });
    var bottomRightPts = canvasToPts({ x: canvasX + canvasW, y: canvasY + canvasH });
    var ann;
    if (state.tool === 'redact') {
      ann = {
        page: state.pageNum, kind: 'redact',
        x: topLeftPts.x, y: topLeftPts.y,
        w: bottomRightPts.x - topLeftPts.x, h: bottomRightPts.y - topLeftPts.y,
        color: '#ffffff',
      };
    } else if (state.tool === 'highlight') {
      ann = {
        page: state.pageNum, kind: 'highlight',
        x: topLeftPts.x, y: topLeftPts.y,
        w: bottomRightPts.x - topLeftPts.x, h: bottomRightPts.y - topLeftPts.y,
        color: state.color,
      };
    } else if (state.tool === 'strike') {
      var startPts = canvasToPts({ x: s.x, y: s.y });
      var endPts   = canvasToPts({ x: eC.x, y: eC.y });
      // Normalise as left→right line.
      var lx = Math.min(startPts.x, endPts.x);
      var ly = (startPts.y + endPts.y) / 2;
      ann = {
        page: state.pageNum, kind: 'strike',
        x: lx, y: ly,
        w: Math.abs(endPts.x - startPts.x), h: 0,
        color: state.color,
      };
    }
    if (ann) {
      state.annotations.push(ann);
      state.history.push({ action: 'add', ann: ann });
      drawOverlayForCurrentPage();
    }
  }

  function undo() {
    var last = state.history.pop();
    if (!last) return;
    if (last.action === 'add') {
      var i = state.annotations.indexOf(last.ann);
      if (i >= 0) state.annotations.splice(i, 1);
    } else if (last.action === 'remove') {
      // Re-insert near where it was.
      var idx = Math.min(last.atIndex, state.annotations.length);
      state.annotations.splice(idx, 0, last.ann);
    }
    drawOverlayForCurrentPage();
  }
  function clearPage() {
    var keep = state.annotations.filter(function (a) { return a.page !== state.pageNum; });
    var dropped = state.annotations.filter(function (a) { return a.page === state.pageNum; });
    if (!dropped.length) return;
    if (!window.confirm('Remove ' + dropped.length + ' annotation(s) from this page?')) return;
    state.annotations = keep;
    state.history = []; // clearing a page invalidates undo for that page
    drawOverlayForCurrentPage();
  }

  function hexToRgb01(h) {
    var s = String(h || '').replace('#', '');
    if (s.length === 3) s = s.replace(/(.)/g, '$1$1');
    var n = parseInt(s, 16);
    if (!isFinite(n)) return { r: 0, g: 0, b: 0 };
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
  }

  async function save() {
    if (!state.pdfDoc) { setStatus('Nothing to save.', true); return; }
    if (!state.annotations.length) { setStatus('No edits to save.'); return; }
    if (!window.PDFLib) { setStatus('PDF editor library not loaded.', true); return; }
    setStatus('Building edited PDF...');
    try {
      // Re-fetch the original PDF bytes (pdf-lib needs them, pdf.js owns its
      // copy internally but doesn't expose it cleanly).
      var resp = await fetch(state.sourceUrl);
      if (!resp.ok) throw new Error('Could not refetch source PDF (' + resp.status + ')');
      var srcBytes = await resp.arrayBuffer();
      var pdfDoc = await window.PDFLib.PDFDocument.load(srcBytes);
      var helvetica = await pdfDoc.embedFont(window.PDFLib.StandardFonts.Helvetica);
      var pages = pdfDoc.getPages();

      state.annotations.forEach(function (a) {
        var page = pages[a.page - 1];
        if (!page) return;
        var size = page.getSize();
        var pageH = size.height;
        var rgb = hexToRgb01(a.color);
        var pdfRgb = window.PDFLib.rgb(rgb.r, rgb.g, rgb.b);
        // Convert canvas-coord points (origin top-left) to PDF user-space (origin bottom-left).
        function toY(yPts) { return pageH - yPts; }

        if (a.kind === 'redact') {
          page.drawRectangle({
            x: a.x, y: toY(a.y + a.h),
            width: a.w, height: a.h,
            color: window.PDFLib.rgb(1, 1, 1),
            borderWidth: 0,
          });
        } else if (a.kind === 'highlight') {
          page.drawRectangle({
            x: a.x, y: toY(a.y + a.h),
            width: a.w, height: a.h,
            color: pdfRgb,
            opacity: 0.35,
            borderWidth: 0,
          });
        } else if (a.kind === 'strike') {
          page.drawLine({
            start: { x: a.x,        y: toY(a.y) },
            end:   { x: a.x + a.w,  y: toY(a.y) },
            thickness: 1.5,
            color: pdfRgb,
          });
        } else if (a.kind === 'text') {
          // a.y was baseline-ish in canvas coords; place text with its baseline at toY(a.y).
          page.drawText(String(a.text || ''), {
            x: a.x,
            y: toY(a.y),
            size: a.size,
            font: helvetica,
            color: pdfRgb,
          });
        }
      });

      var bytes = await pdfDoc.save();
      setStatus('Uploading edited PDF...');

      var fd = new FormData();
      fd.append('chapter_id', state.chapterId || '');
      if (state.grade)    fd.append('grade', state.grade);
      if (state.subject)  fd.append('subject', state.subject);
      if (state.language) fd.append('language', state.language);
      var blob = new Blob([bytes], { type: 'application/pdf' });
      fd.append('file', blob, (state.chapterId || 'chapter') + '.pdf');

      // The base URL helper from looma-ai.js (window.LOOMAAI_BASE optional).
      var base = (window.LOOMAAI_BASE) ||
                 (window.location.protocol + '//' + window.location.hostname + ':8089');
      var res = await fetch(base + '/replace_pdf', { method: 'POST', body: fd });
      var txt = await res.text();
      if (!res.ok) throw new Error(res.status + ' ' + txt);
      var out = {}; try { out = JSON.parse(txt || '{}'); } catch (_) {}
      if (out && out.ok !== true) throw new Error(out && out.error ? out.error : 'Upload failed');
      setStatus('Saved. Backup: ' + (out.paths && out.paths.backup ? out.paths.backup : '(none)'));
      // Reload the PDF in the editor so subsequent edits are off the saved copy.
      // Cache-bust the URL so the browser doesn't return the pre-save bytes.
      state.sourceUrl = state.sourceUrl.split('?')[0] + '?t=' + Date.now();
      state.annotations = [];
      state.history = [];
      await loadPdf();
      // Tell the AI page to refresh status (PDF link / pills).
      try {
        if (typeof window.refreshAIPageStatus === 'function') window.refreshAIPageStatus();
      } catch (_) {}
    } catch (e) {
      setStatus('Save failed: ' + (e && e.message ? e.message : e), true);
    }
  }

  // Public hook used by looma-ai.js to launch the editor.
  window.LoomaPdfEditor = { open: open, close: close };
})();
