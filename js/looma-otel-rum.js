/*
 * looma-otel-rum.js
 *
 * Browser-side OpenTelemetry sender. We deliberately do NOT pull in the full
 * @opentelemetry/sdk-* packages (they add ~150 KB to every Looma page). Instead
 * we hand-roll a tiny OTLP/HTTP JSON exporter that ships:
 *
 *   - resource attributes:           service.name=looma-web-rum, deployment.environment, browser, etc.
 *   - one SERVER_TIMING-style trace: navigation TTFB / domContentLoaded / load
 *   - PerformancePaintTiming + LCP + CLS + INP as histogram metrics
 *   - JavaScript error logs (window.onerror, unhandledrejection)
 *   - SPA-style soft route changes (history.pushState / popstate)
 *
 * The collector accepts cross-origin POSTs because the otel-collector config
 * sets `cors.allowed_origins=["*"]`. If telemetry can't be sent the page
 * keeps working — every emit is wrapped in try/catch + sendBeacon fallback.
 */
(function () {
    'use strict';
    if (window.__LOOMA_RUM_INSTALLED__) return;
    window.__LOOMA_RUM_INSTALLED__ = true;

    var ENDPOINT = (window.LOOMA_OTEL_ENDPOINT || (location.protocol + '//' + location.hostname + ':4318'))
        .replace(/\/+$/, '');
    var SERVICE = window.LOOMA_RUM_SERVICE || 'looma-web-rum';

    function hex(bytes) {
        var s = '';
        for (var i = 0; i < bytes.length; i++) {
            s += ('0' + bytes[i].toString(16)).slice(-2);
        }
        return s;
    }
    function rand(nBytes) {
        var a = new Uint8Array(nBytes);
        (window.crypto || window.msCrypto).getRandomValues(a);
        return hex(a);
    }
    function nowNs() { return String(Date.now() * 1e6); }

    var TRACE_ID = rand(16);
    var SESSION_ID = rand(8);
    // Stable root span for the page session — every auto-instrumented fetch /
    // XHR / domain span hangs off this one so OpenSearch Service Map renders a
    // single connected graph per page load instead of a flat list of orphans.
    var ROOT_SPAN_ID = rand(8);
    // Currently-active span id (manipulated by withSpan / startSpan); used as
    // the default parent for new child spans so nested instrumentation gets the
    // right hierarchy without callers having to thread context manually.
    var ACTIVE_SPAN_ID = ROOT_SPAN_ID;

    function resourceAttrs() {
        return [
            { key: 'service.name',           value: { stringValue: SERVICE } },
            { key: 'service.namespace',      value: { stringValue: 'looma' } },
            { key: 'deployment.environment', value: { stringValue: (window.LOOMA_ENV || 'local') } },
            { key: 'telemetry.sdk.language', value: { stringValue: 'webjs' } },
            { key: 'browser.user_agent',     value: { stringValue: navigator.userAgent || '' } },
            { key: 'browser.language',       value: { stringValue: navigator.language || '' } },
            { key: 'browser.platform',       value: { stringValue: navigator.platform || '' } },
            { key: 'browser.online',         value: { boolValue: !!navigator.onLine } },
            { key: 'session.id',             value: { stringValue: SESSION_ID } },
        ];
    }

    function attrs(obj) {
        var out = [];
        Object.keys(obj || {}).forEach(function (k) {
            var v = obj[k];
            if (v === undefined || v === null) return;
            if (typeof v === 'number') {
                if (Number.isInteger(v)) out.push({ key: k, value: { intValue: String(v) } });
                else                     out.push({ key: k, value: { doubleValue: v } });
            } else if (typeof v === 'boolean') {
                out.push({ key: k, value: { boolValue: v } });
            } else {
                out.push({ key: k, value: { stringValue: String(v) } });
            }
        });
        return out;
    }

    function post(path, body) {
        try {
            var json = JSON.stringify(body);
            // NOTE: we deliberately do NOT use navigator.sendBeacon here.
            // Beacons send cookies (credentialed), and the OTel Collector is
            // configured with `Access-Control-Allow-Origin: *`, which the
            // browser rejects for credentialed requests. Plain `fetch` with
            // `credentials: 'omit'` keeps the request uncredentialed so the
            // wildcard CORS response is accepted.
            fetch(ENDPOINT + path, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: json,
                keepalive: true,
                mode: 'cors',
                credentials: 'omit',
            }).catch(function () {});
        } catch (e) { /* swallow */ }
    }

    // ---------- Traces ----------
    function emitSpan(name, startMs, endMs, kind, extra, opts) {
        if (!startMs || !endMs || endMs < startMs) return;
        opts = opts || {};
        var span = {
            traceId: TRACE_ID,
            spanId: opts.spanId || rand(8),
            name: name,
            kind: kind || 1, // INTERNAL
            startTimeUnixNano: String(startMs * 1e6),
            endTimeUnixNano:   String(endMs * 1e6),
            attributes: attrs(Object.assign({
                'url.full':  location.href,
                'url.path':  location.pathname,
                'browser.viewport_width':  window.innerWidth,
                'browser.viewport_height': window.innerHeight,
            }, extra || {})),
            status: { code: opts.statusCode || 0 },
        };
        // Attach to the page-session root unless caller passed a parent.
        var parent = (opts.parentSpanId === null) ? null
                    : (opts.parentSpanId || ROOT_SPAN_ID);
        if (parent) span.parentSpanId = parent;
        post('/v1/traces', {
            resourceSpans: [{
                resource: { attributes: resourceAttrs() },
                scopeSpans: [{
                    scope: { name: 'looma-rum' },
                    spans: [span],
                }],
            }],
        });
    }

    // ---------- Manual span helper ----------
    // withSpan(name, attrs, fn) runs fn(ctx) and emits a child span on return.
    // ctx exposes:
    //   ctx.traceparent  — W3C header value to inject in downstream HTTP calls
    //   ctx.spanId       — the child span's id
    //   ctx.setAttr(k,v) — add attribute (e.g. result count, hit/miss)
    //   ctx.error(err)   — mark the span as failed
    function withSpan(name, extra, fn) {
        var spanId = rand(8);
        var startMs = performance.now() + performance.timeOrigin;
        var attrsBag = Object.assign({}, extra || {});
        var statusCode = 0;
        var prevActive = ACTIVE_SPAN_ID;
        ACTIVE_SPAN_ID = spanId;
        var ctx = {
            spanId: spanId,
            traceId: TRACE_ID,
            traceparent: '00-' + TRACE_ID + '-' + spanId + '-01',
            setAttr: function (k, v) { attrsBag[k] = v; },
            error: function (err) {
                statusCode = 2; // ERROR
                if (err) {
                    attrsBag['exception.message'] = (err && err.message) || String(err);
                    if (err && err.stack) attrsBag['exception.stacktrace'] = String(err.stack);
                }
            },
        };
        var done = false;
        function finish() {
            if (done) return;
            done = true;
            ACTIVE_SPAN_ID = prevActive;
            var endMs = performance.now() + performance.timeOrigin;
            emitSpan(name, startMs, endMs, 1, attrsBag, {
                spanId: spanId, parentSpanId: prevActive, statusCode: statusCode,
            });
        }
        try {
            var r = fn(ctx);
            // If fn returns a thenable, finish on settle.
            if (r && typeof r.then === 'function') {
                return r.then(function (v) { finish(); return v; },
                              function (e) { ctx.error(e); finish(); throw e; });
            }
            finish();
            return r;
        } catch (e) {
            ctx.error(e); finish(); throw e;
        }
    }

    // ---------- fetch + XHR auto-instrumentation ----------
    // Wraps every browser HTTP call as a CLIENT span and injects W3C
    // `traceparent` so the PHP / Python services on the other end see this
    // browser as the parent — that's what makes the OpenSearch Service Map
    // connect `looma-web-rum` to `looma-web` to `looma-search` / `looma-ai`.
    function shouldTrace(url) {
        try {
            // Skip the OTLP collector itself to avoid infinite loops.
            if (!url) return false;
            if (url.indexOf(ENDPOINT) === 0) return false;
            return true;
        } catch (e) { return false; }
    }
    // Adding `traceparent` upgrades a "simple" CORS request to one that
    // requires a preflight. Cross-origin servers (e.g. looma-ai on :8089)
    // typically don't list `traceparent` in Access-Control-Allow-Headers,
    // so preflight fails and the actual request never goes out — which is
    // what was breaking /chapter_status. We restrict header injection to
    // same-origin URLs; client spans still get emitted either way, the
    // server side just won't re-parent under the browser span when it's a
    // different origin.
    function isSameOrigin(url) {
        try {
            var u = new URL(url, location.href);
            return u.origin === location.origin;
        } catch (e) { return false; }
    }
    function urlAttrs(url, method) {
        var u = String(url || '');
        var path = u;
        try { path = (new URL(u, location.href)).pathname; } catch (e) {}
        return {
            'http.request.method': (method || 'GET').toUpperCase(),
            'http.url': u,
            'url.path': path,
        };
    }
    if (window.fetch && !window.fetch.__looma_wrapped__) {
        var _origFetch = window.fetch.bind(window);
        var wrapped = function (input, init) {
            var url = (typeof input === 'string') ? input : (input && input.url) || '';
            if (!shouldTrace(url)) return _origFetch(input, init);
            init = init || {};
            var method = (init.method || (input && input.method) || 'GET');
            var spanId = rand(8);
            if (isSameOrigin(url)) {
                var headers = new Headers(init.headers || (input && input.headers) || {});
                headers.set('traceparent', '00-' + TRACE_ID + '-' + spanId + '-01');
                init.headers = headers;
            }
            var startMs = performance.now() + performance.timeOrigin;
            var attrsBag = urlAttrs(url, method);
            return _origFetch(input, init).then(function (resp) {
                attrsBag['http.response.status_code'] = resp.status;
                var endMs = performance.now() + performance.timeOrigin;
                emitSpan('HTTP ' + attrsBag['http.request.method'], startMs, endMs, 3, attrsBag, {
                    spanId: spanId, parentSpanId: ACTIVE_SPAN_ID,
                    statusCode: resp.status >= 400 ? 2 : 0,
                });
                return resp;
            }, function (err) {
                attrsBag['exception.message'] = (err && err.message) || String(err);
                var endMs = performance.now() + performance.timeOrigin;
                emitSpan('HTTP ' + attrsBag['http.request.method'], startMs, endMs, 3, attrsBag, {
                    spanId: spanId, parentSpanId: ACTIVE_SPAN_ID, statusCode: 2,
                });
                throw err;
            });
        };
        wrapped.__looma_wrapped__ = true;
        window.fetch = wrapped;
    }
    if (window.XMLHttpRequest && !window.XMLHttpRequest.prototype.__looma_wrapped__) {
        var _open = XMLHttpRequest.prototype.open;
        var _send = XMLHttpRequest.prototype.send;
        var _setHeader = XMLHttpRequest.prototype.setRequestHeader;
        XMLHttpRequest.prototype.open = function (method, url) {
            this.__looma_method__ = method;
            this.__looma_url__ = url;
            this.__looma_trace__ = shouldTrace(url);
            return _open.apply(this, arguments);
        };
        XMLHttpRequest.prototype.setRequestHeader = function (k) {
            // Track whether the caller already set traceparent (rare) so we
            // don't clobber an explicit one.
            if (k && k.toLowerCase() === 'traceparent') this.__looma_tp_set__ = true;
            return _setHeader.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function () {
            var xhr = this;
            if (!xhr.__looma_trace__) return _send.apply(xhr, arguments);
            var spanId = rand(8);
            // Only inject traceparent on same-origin XHRs — cross-origin
            // would force a CORS preflight that most Looma services don't
            // accept (`Access-Control-Allow-Headers` doesn't list
            // `traceparent`), which would silently break the call.
            try {
                if (!xhr.__looma_tp_set__ && isSameOrigin(xhr.__looma_url__)) {
                    _setHeader.call(xhr, 'traceparent', '00-' + TRACE_ID + '-' + spanId + '-01');
                }
            } catch (e) { /* setRequestHeader may throw if state changed */ }
            var startMs = performance.now() + performance.timeOrigin;
            var parentId = ACTIVE_SPAN_ID;
            var attrsBag = urlAttrs(xhr.__looma_url__, xhr.__looma_method__);
            xhr.addEventListener('loadend', function () {
                var endMs = performance.now() + performance.timeOrigin;
                attrsBag['http.response.status_code'] = xhr.status || 0;
                var s = (xhr.status >= 400 || xhr.status === 0) ? 2 : 0;
                emitSpan('HTTP ' + attrsBag['http.request.method'], startMs, endMs, 3, attrsBag, {
                    spanId: spanId, parentSpanId: parentId, statusCode: s,
                });
            });
            return _send.apply(xhr, arguments);
        };
        XMLHttpRequest.prototype.__looma_wrapped__ = true;
    }

    // ---------- Metrics (gauge/histogram-like) ----------
    function emitGauge(name, value, unit, extra) {
        post('/v1/metrics', {
            resourceMetrics: [{
                resource: { attributes: resourceAttrs() },
                scopeMetrics: [{
                    scope: { name: 'looma-rum' },
                    metrics: [{
                        name: name,
                        unit: unit || '1',
                        gauge: { dataPoints: [{
                            attributes: attrs(Object.assign({
                                'url.path': location.pathname,
                            }, extra || {})),
                            timeUnixNano: nowNs(),
                            asDouble: value,
                        }] },
                    }],
                }],
            }],
        });
    }

    // ---------- Logs ----------
    function emitLog(severity, body, extra) {
        post('/v1/logs', {
            resourceLogs: [{
                resource: { attributes: resourceAttrs() },
                scopeLogs: [{
                    scope: { name: 'looma-rum' },
                    logRecords: [{
                        timeUnixNano: nowNs(),
                        severityNumber: severity || 9,
                        severityText: severity >= 17 ? 'ERROR' : 'INFO',
                        body: { stringValue: String(body || '') },
                        attributes: attrs(Object.assign({
                            'url.full': location.href,
                            'url.path': location.pathname,
                        }, extra || {})),
                    }],
                }],
            }],
        });
    }

    // ---------- Navigation timing ----------
    function reportNavigation() {
        try {
            var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0])
                   || performance.timing;
            if (!nav) return;
            // Both shapes (PerformanceNavigationTiming + legacy) expose these fields.
            var navStart = nav.startTime || 0;
            var ttfb     = (nav.responseStart || 0) - navStart;
            var dom      = (nav.domContentLoadedEventEnd || 0) - navStart;
            var load     = (nav.loadEventEnd || 0) - navStart;
            emitSpan('rum.navigation', navStart, navStart + Math.max(load, dom, ttfb, 1), 1, {
                'http.response.status_code': window.LOOMA_HTTP_STATUS || 200,
                'http.url': location.href,
                'http.method': 'GET',
                'navigation.ttfb_ms': ttfb,
                'navigation.dom_content_loaded_ms': dom,
                'navigation.load_ms': load,
            });
            if (ttfb > 0) emitGauge('looma_rum_ttfb_ms', ttfb, 'ms');
            if (dom  > 0) emitGauge('looma_rum_dcl_ms',  dom,  'ms');
            if (load > 0) emitGauge('looma_rum_load_ms', load, 'ms');
        } catch (e) {}
    }

    // ---------- Web Vitals (LCP, CLS, INP) ----------
    function observe(type, cb) {
        try {
            var po = new PerformanceObserver(function (list) {
                list.getEntries().forEach(cb);
            });
            po.observe({ type: type, buffered: true });
        } catch (e) {}
    }
    observe('largest-contentful-paint', function (e) {
        emitGauge('looma_rum_lcp_ms', e.startTime || 0, 'ms', { 'lcp.element': (e.element && e.element.tagName) || '' });
    });
    var clsValue = 0;
    observe('layout-shift', function (e) {
        if (!e.hadRecentInput) clsValue += (e.value || 0);
        emitGauge('looma_rum_cls', clsValue, '1');
    });
    observe('event', function (e) {
        if ((e.duration || 0) > 40) {
            emitGauge('looma_rum_inp_ms', e.duration, 'ms', { 'event.name': e.name });
        }
    });
    observe('paint', function (e) {
        if (e.name === 'first-contentful-paint') emitGauge('looma_rum_fcp_ms', e.startTime, 'ms');
    });

    // ---------- JS errors ----------
    window.addEventListener('error', function (ev) {
        emitLog(17, ev.message || 'window.error', {
            'error.type': 'js',
            'error.filename': ev.filename, 'error.lineno': ev.lineno, 'error.colno': ev.colno,
            'error.stack': (ev.error && ev.error.stack) || '',
        });
    });
    window.addEventListener('unhandledrejection', function (ev) {
        var reason = ev.reason;
        emitLog(17, (reason && reason.message) || String(reason), {
            'error.type': 'unhandledrejection',
            'error.stack': (reason && reason.stack) || '',
        });
    });

    // ---------- Soft route changes (SPA-ish) ----------
    var lastPath = location.pathname;
    function onRoute() {
        if (location.pathname === lastPath) return;
        var prev = lastPath; lastPath = location.pathname;
        emitLog(9, 'route.change', { 'from': prev, 'to': location.pathname });
        reportNavigation();
    }
    window.addEventListener('popstate', onRoute);
    var _ps = history.pushState;
    history.pushState = function () { var r = _ps.apply(this, arguments); onRoute(); return r; };

    // ---------- User interaction counters ----------
    document.addEventListener('click', function (ev) {
        var t = ev.target || {};
        var tag = (t.tagName || '').toLowerCase();
        var id  = t.id || '';
        var cls = (t.className || '').toString().split(/\s+/).slice(0, 3).join(' ');
        emitGauge('looma_rum_click_total', 1, '1', { 'el.tag': tag, 'el.id': id, 'el.class': cls });
    }, { capture: true, passive: true });

    // Fire navigation report once load is fully done.
    if (document.readyState === 'complete') reportNavigation();
    else window.addEventListener('load', function () { setTimeout(reportNavigation, 0); });

    // Expose for app code to add domain spans.
    window.LOOMA = window.LOOMA || {};
    window.LOOMA.otel = {
        emitSpan: emitSpan,
        emitGauge: emitGauge,
        emitLog: emitLog,
        withSpan: withSpan,
        sessionId: SESSION_ID,
        traceId: TRACE_ID,
        rootSpanId: ROOT_SPAN_ID,
        // Always reflects the *current* active span — the in-flight
        // withSpan() body, or the page-session root.
        currentSpanId: function () { return ACTIVE_SPAN_ID; },
        currentTraceparent: function () {
            return '00-' + TRACE_ID + '-' + ACTIVE_SPAN_ID + '-01';
        },
    };
})();
