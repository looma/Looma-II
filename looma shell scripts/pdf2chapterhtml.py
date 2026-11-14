"""Convert Looma chapter PDFs to self-contained HTML.

Two pipelines, chosen per file:

  vector - the PDF carries real fonts. The page artwork (illustrations, banners,
           rules, curves) is kept exactly, as an inline SVG with every glyph
           stripped out of it; the words are then laid back over that as REAL
           HTML text. So the design survives and the text is real text: readable
           in the file, selectable, searchable, editable.

  scan   - the PDF is a scanned raster page plus Tesseract's invisible OCR text
           (GlyphLessFont). There is no separable text or artwork - the page IS
           the picture - so it is re-rendered to a JPEG at 150 dpi with the OCR
           words laid over it as a transparent text layer.

Both give the page a '.tl.pdf-text' layer, which is what makes
LOOMA.speak.highlightBlock() draw the reading highlight as one merged yellow bar
per line (renderPdfHighlight) instead of a box per word.

pdf2htmlEX was tried first and rejected: its poppler build silently drops every
JPEG-2000 image - most of the illustrations in these textbooks - and it crashes
outright on the glyph-less OCR font.
"""
import base64
import html as H
import json
import os
import re
import sys
import time
import fitz

import preeti

DPI = 150            # scanned page raster
CROP_DPI = 200       # small crops for text we cannot decode
JPEG_QUALITY = 88

CSS = """*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:#e8e8e8;padding:18px 0;font-family:Georgia,'Times New Roman',serif;
     -webkit-text-size-adjust:100%}
.book{margin:0 auto;max-width:1000px;padding:0 10px}
.page{position:relative;margin:0 auto 24px auto;background:#fff;
      box-shadow:0 2px 12px rgba(0,0,0,.28);container-type:inline-size;overflow:hidden}
.page>svg,.page>img.bg{display:block;width:100%;height:auto}
img.rn{position:absolute}
.tl{position:absolute;left:0;top:0;width:100%;height:100%}
.tl span{position:absolute;white-space:pre;transform-origin:0 0;line-height:1;cursor:text}
.scan .tl span{color:transparent}
/* Selecting text and hearing it read back are two different things, so they get
   two different colours: blue for the selection (as the pdf.js text layer does),
   yellow for the reading highlight below. Translucent, because on a scanned page
   an opaque selection would hide the ink underneath it. */
.tl span::-moz-selection{background:rgba(0,110,255,.32)}
.tl span::selection{background:rgba(0,110,255,.32)}
/* The reading highlight: looma-utilities.js renderPdfHighlight() creates these
   bands inside this document (we are in an iframe, so looma.css does not reach
   here) - one band per line, drawn over the text. Keep in sync with
   .tts-pdf-highlight in Looma/css/looma.css. */
.tts-pdf-highlight{background-color:rgba(255,214,0,.42);border-radius:.15em;z-index:1}
@media print{body{background:#fff;padding:0}.page{box-shadow:none;margin:0 auto}
             .tts-pdf-highlight{display:none}}"""

# Squeeze each run onto the width it occupied in the PDF, so substituted fonts
# cannot push a line out of shape (the trick PDF.js uses for its text layer).
JS = """(function(){function f(){var s=document.querySelectorAll('.tl span[data-w]');
for(var i=0;i<s.length;i++){var e=s[i];e.style.transform='';
var n=e.getBoundingClientRect().width;if(!n)continue;
var t=e.parentNode.getBoundingClientRect().width*parseFloat(e.getAttribute('data-w'))/100;
var k=t/n;
/* Only nudge for font-substitution differences. A bbox that disagrees by more
   than this is a bad bbox, and honouring it would squash the run to a sliver. */
if(k>0.5&&k<2)e.style.transform='scaleX('+k+')';}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',f);else f();
var r;addEventListener('resize',function(){clearTimeout(r);r=setTimeout(f,150)});})();"""

# MuPDF numbers svg ids per page (clip_3, font_1_46, ...), so inlining several
# pages in one document would make them collide.
_ID = re.compile(r'\bid="([^"]+)"')
_URL = re.compile(r'url\(#([^)]+)\)')
_HREF = re.compile(r'(xlink:href|href)="#([^"]+)"')
_SVGTAG = re.compile(r"^<svg\b[^>]*>")

DEVA_STACK = ("'Noto Sans Devanagari','Kalimati','Mangal','Nirmala UI',"
              "'Sanskrit Text',sans-serif")
SANS = "Arial,Helvetica,sans-serif"
SERIF = "Georgia,'Times New Roman',serif"
MONO = "'Courier New',monospace"
SANS_KEYS = ("arial", "helvetica", "gothic", "avant", "avalon", "verdana",
             "tahoma", "calibri", "futura", "franklin", "gill", "myriad",
             "segoe", "univers", "frutiger", "optima", "sans", "nagarik")
MONO_KEYS = ("mono", "courier", "consol")


def family(name, devanagari):
    if devanagari:
        return DEVA_STACK
    n = (name or "").split("+")[-1].lower()
    if any(k in n for k in MONO_KEYS):
        return MONO
    if any(k in n for k in SANS_KEYS):
        return SANS
    return SERIF


def namespace_svg(svg, n):
    """Namespace the page's svg ids so several pages can share one document."""
    p = "p%d_" % n
    svg = _ID.sub(lambda m: 'id="%s%s"' % (p, m.group(1)), svg)
    svg = _URL.sub(lambda m: "url(#%s%s)" % (p, m.group(1)), svg)
    svg = _HREF.sub(lambda m: '%s="#%s%s"' % (m.group(1), p, m.group(2)), svg)
    # let the page scale with its container instead of using the fixed pt size
    svg = _SVGTAG.sub(lambda m: re.sub(r'\s(width|height)="[^"]*"', "", m.group(0)),
                      svg, count=1)
    return svg


def line_runs(line):
    """Span text for one line, with the fake spaces taken out.

    Several of these textbooks come from a generator that gives the last glyph of
    a text-showing operator a zero advance and then emits the real advance as a
    separate space. Extraction therefore reads "Mathematics" as "Mathem atic s".
    A space that directly follows a zero-width glyph is that glyph's advance, not
    a space, so it is dropped and its width handed back to the run before it.
    """
    out = []                       # [x0, y0, x1, y1, text, span]
    prev_zero = False
    for s in line["spans"]:
        # A space much wider than a normal one is a gap the PDF leaves for
        # something drawn as line art (the radical in "Does √64"). One span
        # stretched across it squeezes or stretches the words on either side
        # over that drawing, so the run is split there.
        # (horizontal lines only: a rotated label has no such gaps to find)
        gap = 0.8 * (s.get("size") or 0) if abs(line["dir"][1]) < 0.05 else 0
        segs = [[[], None, None]]  # [chars, x0, x1]
        for c in s["chars"]:
            ch = c["c"]
            w = c["bbox"][2] - c["bbox"][0]
            if ch.isspace() and prev_zero:
                prev_zero = False   # the advance is spent; don't eat the next one
                continue
            prev_zero = (w <= 0)
            if ch.isspace() and gap and w > gap and segs[-1][0]:
                segs.append([[], None, None])
                continue
            # ... or no space at all, just a jump in position
            if (gap and w > 0 and segs[-1][2] is not None
                    and c["bbox"][0] - segs[-1][2] > 0.5 * s["size"]):
                segs.append([[], None, None])
            seg = segs[-1]
            seg[0].append(ch)
            if w > 0:
                seg[1] = c["bbox"][0] if seg[1] is None else seg[1]
                seg[2] = c["bbox"][2]
        segs = [x for x in segs if "".join(x[0]).strip()] if len(segs) > 1 else segs
        b = list(s["bbox"])
        if len(segs) > 1 and all(x[1] is not None for x in segs):
            for chars, x0, x1 in segs:
                out.append([x0, b[1], x1, b[3], "".join(chars), s])
            continue
        t = "".join(ch for x in segs for ch in x[0])
        if not t:
            # nothing left: give the width to the previous run so it still ends
            # where the ink does
            if out:
                out[-1][2] = max(out[-1][2], b[2])
            continue
        out.append([b[0], b[1], b[2], b[3], t, s])
    return out


def runs(page, maps, decode_text):
    """Yield (rect, text, span, mode, devanagari) for every run, in reading order.

    mode is 'text' (render as characters) or 'image' (a legacy 8-bit Nepali font
    with no mapping - the bytes are not the characters, so it has to stay a
    picture).
    """
    mat = page.rotation_matrix          # text comes back in unrotated space
    for block in page.get_text("rawdict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            for x0, y0, x1, y1, t, s in line_runs(line):
                b = fitz.Rect(x0, y0, x1, y1) * mat
                b.normalize()
                # A run whose advance width MuPDF could not work out comes back
                # with a degenerate bbox. Its glyphs are still drawn on the page,
                # so dropping it would lose characters ("8.0 Review" -> ".0
                # Review"); keep it and let the font size place it instead.
                if b.height <= 0:
                    continue
                mode, deva = "text", False
                if abs(line["dir"][1]) >= 0.05:
                    # rotated (a chart's axis title): HTML text is laid out
                    # horizontally, so this one keeps its ink (see page_html)
                    s = dict(s, rotated=True)
                if decode_text:
                    table, legacy = preeti.resolve(s["font"], maps)
                    if legacy and table:
                        t, deva = preeti.convert(t, table), True
                    elif legacy:
                        mode = "image"
                    elif any("ऀ" <= c <= "ॿ" for c in t):
                        deva = True
                yield b, t, s, mode, deva


def strip_page_text(page, boxes):
    """Erase the page's own text, leaving artwork and images untouched.

    Redaction at PDF level rather than surgery on the exported svg: MuPDF draws
    glyphs differently from file to file (<use> of a font path, an inline path,
    ...), so pattern-matching the svg silently misses some and the page then
    shows its old text underneath the new HTML text.
    """
    for b in boxes:
        r = fitz.Rect(b)
        if r.width <= 0:          # degenerate advance; widen so it still covers
            r.x1 = r.x0 + max(r.height, 1)
        if r.height <= 0:
            r.y1 = r.y0 + 1
        page.add_redact_annot(r, fill=False)
    if boxes:
        page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                              graphics=fitz.PDF_REDACT_LINE_ART_NONE,
                              text=fitz.PDF_REDACT_TEXT_REMOVE)


_PUA = re.compile("[\ue000-\uf8ff]")
# Text whose font maps some glyphs to the wrong characters (a CID font with an
# incomplete ToUnicode: "'iscuss in \\our grouS ... ansZer" for "Discuss in
# your group ... answer"): control characters, backslashes, a capital inside a
# lowercase word. A false positive costs nothing visible (the ink stays).
_GARBLED = re.compile("[\x00-\x08\x0b\x0c\x0e-\x1f\\\\]|[a-z][A-Z][a-z]")


def text_left(page, kept):
    """True when text other than the deliberately kept runs is still on the
    page after strip_page_text(). Redaction does not reach every glyph (text
    inside some form XObjects: tables of contents, equation objects in the
    Grade 8 maths books); the svg would then draw that text under the HTML
    text, showing every word twice. Character centres, so a glyph with a
    degenerate box still counts."""
    mat = page.rotation_matrix
    for block in page.get_text("rawdict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                for c in span["chars"]:
                    if c["c"].isspace():
                        continue
                    r = fitz.Rect(c["bbox"]) * mat
                    r.normalize()
                    mid = fitz.Point((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2)
                    if not any(mid in k for k in kept):
                        return True
    return False


def page_html(doc, page, n, kind, maps):
    r = page.rect
    W, Hh = r.width, r.height
    rot = page.rotation
    parts = []
    # everything is read off the page BEFORE the text is stripped from it
    items = list(runs(page, maps, kind != "scan"))

    if kind == "scan":
        pm = page.get_pixmap(dpi=DPI)
        if pm.alpha:
            pm = fitz.Pixmap(fitz.csRGB, pm)
        parts.append('<img class="bg" alt="" src="data:image/jpeg;base64,%s"/>'
                     % base64.b64encode(pm.tobytes("jpeg", jpg_quality=JPEG_QUALITY))
                            .decode("ascii"))
    else:
        crops = [(b, page.get_pixmap(clip=b, dpi=CROP_DPI))
                 for b, _t, _s, mode, _d in items if mode == "image"]
        # Symbol-font runs with no Unicode (big-bracket pieces, Wingdings
        # bullets: Private Use Area code points) have no glyph in any browser
        # font. Leave their ink in the artwork and give them a transparent span.
        # Math-font runs (Word equations, Cambria Math) extract each letter
        # twice ("𝑥𝑥" for one drawn x), rotated runs cannot be redrawn as
        # horizontal HTML text, and garbled runs would show wrong letters:
        # same treatment.
        keep = {i for i, (_b, t, s, mode, _d) in enumerate(items)
                if mode == "text" and (_PUA.search(t) or "math" in s["font"].lower()
                                       or s.get("rotated") or _GARBLED.search(t))}
        boxes = [it[0] for i, it in enumerate(items) if i not in keep]
        # Try the redaction on a copy first. Where some text survives it
        # (text in some form XObjects: tables of contents, equation objects),
        # the svg would draw it under the HTML text (every word twice), and
        # redaction can also take only part of a run. So on such a page strip
        # nothing: the artwork keeps all its original text, exactly as in the
        # PDF, and every span becomes an invisible, selectable copy.
        probe = fitz.open()
        probe.insert_pdf(doc, from_page=page.number, to_page=page.number)
        strip_page_text(probe[0], boxes)
        surv = text_left(probe[0], [items[i][0] + (-1, -1, 1, 1) for i in keep])
        probe.close()
        if surv:
            ghost = {i for i, it in enumerate(items) if it[3] == "text"}
        else:
            strip_page_text(page, boxes)
            ghost = keep
        parts.append(namespace_svg(page.get_svg_image(text_as_path=True), n))
        for b, pm in crops:
            if pm.alpha:
                pm = fitz.Pixmap(fitz.csRGB, pm)
            parts.append('<img class="rn" alt="" style="left:%.3f%%;top:%.3f%%;'
                         'width:%.3f%%;height:%.3f%%" src="data:image/jpeg;base64,%s"/>'
                         % (b.x0 / W * 100, b.y0 / Hh * 100, b.width / W * 100,
                            b.height / Hh * 100,
                            base64.b64encode(pm.tobytes("jpeg", jpg_quality=JPEG_QUALITY))
                                  .decode("ascii")))

    spans = []
    for i, (b, t, s, mode, deva) in enumerate(items):
        left, top = b.x0 / W * 100, b.y0 / Hh * 100
        if mode == "image":
            continue        # already placed above, as a crop of the original ink
        if kind != "scan" and i in ghost:
            # its ink is still in the svg: an invisible, selectable copy only
            t = _PUA.sub("", re.sub("[\x00-\x08\x0b\x0c\x0e-\x1f]", "", t))
            if not t.strip():
                continue

        if kind == "scan":
            style = "left:%.3f%%;top:%.3f%%;font-size:%.3fcqw" % (
                left, top, b.height / W * 100)
        else:
            style = ("left:%.3f%%;top:%.3f%%;font-size:%.3fcqw;font-family:%s;color:#%06x"
                     % (left, top, s["size"] / W * 100,
                        family(s["font"], deva), s["color"] & 0xFFFFFF))
            if s["flags"] & 16:
                style += ";font-weight:700"
            if s["flags"] & 2:
                style += ";font-style:italic"
            if i in ghost:
                style += ";color:transparent"
        # No width fit when the page is rotated (a horizontal span cannot match
        # rotated ink) or when the bbox is degenerate.
        if rot in (90, 270) or b.width <= 0:
            spans.append('<span style="%s">%s</span>' % (style, H.escape(t)))
        else:
            spans.append('<span style="%s" data-w="%.3f">%s</span>'
                         % (style, b.width / W * 100, H.escape(t)))

    # 'pdf-text' is what makes LOOMA.speak.highlightBlock() take its band path
    # (closest('.pdf-text, .textLayer') in looma-utilities.js).
    return ('<div class="page %s" style="aspect-ratio:%.4f/%.4f">%s'
            '<div class="tl pdf-text">%s</div></div>'
            % (kind, W, Hh, "".join(parts), "".join(spans)))


def convert(pdf, out, title, lang, kind, maps):
    doc = fitz.open(pdf)
    pages = [page_html(doc, p, i, kind, maps) for i, p in enumerate(doc)]
    npages = doc.page_count
    doc.close()
    doc_html = (
        '<!DOCTYPE html>\n<html lang="%s">\n<head>\n<meta charset="utf-8"/>\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1"/>\n'
        '<title>%s</title>\n<style>\n%s\n</style>\n</head>\n<body>\n'
        '<div class="book">\n%s\n</div>\n<script>%s</script>\n</body>\n</html>\n'
        % (lang, H.escape(title), CSS, "\n".join(pages), JS))
    tmp = out + ".part"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(doc_html)
    os.replace(tmp, out)
    return npages, len(doc_html.encode("utf-8"))


_MAPS = None


def worker(job):
    global _MAPS
    if _MAPS is None:
        _MAPS = preeti.load_maps()
    t = time.time()
    try:
        n, size = convert(job["pdf"], job["html"], job["title"], job["lang"],
                          job["kind"], _MAPS)
        return ("OK", job["rel"], n, size, time.time() - t, "")
    except Exception as e:
        try:
            os.remove(job["html"] + ".part")
        except OSError:
            pass
        return ("FAIL", job["rel"], 0, 0, time.time() - t, repr(e))


def main():
    jobs = json.load(open(sys.argv[1], encoding="utf-8"))
    nproc = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    logpath = sys.argv[3] if len(sys.argv) > 3 else "convert.log"
    import multiprocessing as mp

    ok = fail = 0
    total = len(jobs)
    t0 = time.time()
    with open(logpath, "w", encoding="utf-8") as log, mp.Pool(nproc) as pool:
        for i, r in enumerate(pool.imap_unordered(worker, jobs, chunksize=4), 1):
            log.write("%s\t%s\t%d\t%d\t%.2f\t%s\n" % r)
            if r[0] == "OK":
                ok += 1
            else:
                fail += 1
                print("FAIL %s %s" % (r[1], r[5]), flush=True)
            if i % 100 == 0 or i == total:
                el = time.time() - t0
                print("%d/%d ok=%d fail=%d %.0fs elapsed, eta %.0fs"
                      % (i, total, ok, fail, el, el / i * (total - i)), flush=True)
    print("DONE ok=%d fail=%d in %.0fs" % (ok, fail, time.time() - t0))


if __name__ == "__main__":
    main()
