<?php
/*
 * Tiny OpenTelemetry shim for the Looma PHP frontend.
 *
 * No composer dependencies: emits OTLP/HTTP JSON spans to the OTel Collector
 * on shutdown (fire-and-forget).
 *
 * Config (standard OTEL_* env vars):
 *   OTEL_SERVICE_NAME            (default: looma-web)
 *   OTEL_EXPORTER_OTLP_ENDPOINT  (default: http://looma-otel-collector:4318)
 *   OTEL_DISABLED                (set to 1 to skip emission)
 *
 * This file also exposes tiny helpers so PHP endpoints can create extra
 * child spans and propagate trace context (traceparent) to downstream calls.
 */

if (!function_exists('looma_otel_bootstrap')) {

    function looma_otel_now_nanos() {
        return (string) ((int) round(microtime(true) * 1e9));
    }

    function looma_otel_random_hex($bytes) {
        try {
            return bin2hex(random_bytes($bytes));
        } catch (Throwable $e) {
            return bin2hex(openssl_random_pseudo_bytes($bytes));
        }
    }

    function looma_otel_hex_to_b64($hex) {
        $bin = @hex2bin((string) $hex);
        if ($bin === false) return null;
        return base64_encode($bin);
    }

    function looma_otel_format_traceparent($traceIdHex, $spanIdHex, $flags = '01') {
        $traceIdHex = strtolower((string) $traceIdHex);
        $spanIdHex  = strtolower((string) $spanIdHex);
        $flags      = strtolower((string) ($flags ?: '01'));
        return "00-$traceIdHex-$spanIdHex-$flags";
    }

    function looma_otel_parse_traceparent($tp) {
        $tp = trim((string) $tp);
        if ($tp === '') return null;
        if (!preg_match('/^[0-9a-f]{2}-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i', $tp, $m)) {
            return null;
        }
        $traceId = strtolower($m[1]);
        $spanId  = strtolower($m[2]);
        $flags   = strtolower($m[3]);
        if ($traceId === str_repeat('0', 32)) return null;
        if ($spanId === str_repeat('0', 16)) return null;
        return ['trace_id_hex' => $traceId, 'parent_span_id_hex' => $spanId, 'flags' => $flags];
    }

    function looma_otel_attr_value($v) {
        if (is_bool($v)) return ['boolValue' => $v];
        if (is_int($v)) return ['intValue' => (string) $v];
        if (is_float($v)) return ['doubleValue' => $v];
        if ($v === null) return ['stringValue' => ''];
        if (is_array($v) || is_object($v)) return ['stringValue' => (string) json_encode($v)];
        return ['stringValue' => (string) $v];
    }

    function looma_otel_build_attrs($attrs) {
        $out = [];
        if (!is_array($attrs)) return $out;
        foreach ($attrs as $k => $v) {
            if ($k === '' || $k === null) continue;
            $out[] = ['key' => (string) $k, 'value' => looma_otel_attr_value($v)];
        }
        return $out;
    }

    function looma_otel_start_span($name, $attrs = [], $kind = 1, $parentSpanIdHex = null) {
        if (getenv('OTEL_DISABLED') === '1') return null;
        if (!isset($GLOBALS['looma_otel_trace_id_hex']) || !isset($GLOBALS['looma_otel_root_span_id_hex'])) {
            return null;
        }

        $traceIdHex = $GLOBALS['looma_otel_trace_id_hex'];
        $traceIdB64 = $GLOBALS['looma_otel_trace_id_b64'];
        $flags      = $GLOBALS['looma_otel_trace_flags'] ?? '01';

        $spanIdHex = looma_otel_random_hex(8);
        $spanIdB64 = looma_otel_hex_to_b64($spanIdHex);
        if ($spanIdB64 === null) return null;

        $parentHex = $parentSpanIdHex ?: $GLOBALS['looma_otel_root_span_id_hex'];
        $parentB64 = $parentHex ? looma_otel_hex_to_b64($parentHex) : null;

        if (!isset($GLOBALS['looma_otel_spans']) || !is_array($GLOBALS['looma_otel_spans'])) {
            $GLOBALS['looma_otel_spans'] = [];
        }

        $start = looma_otel_now_nanos();
        $span = [
            'traceId' => $traceIdB64,
            'spanId' => $spanIdB64,
            'name' => (string) $name,
            'kind' => (int) $kind,
            'startTimeUnixNano' => $start,
            'endTimeUnixNano' => $start,
            'attributes' => looma_otel_build_attrs($attrs),
            'status' => ['code' => 0],
        ];
        if ($parentB64) {
            $span['parentSpanId'] = $parentB64;
        }

        $GLOBALS['looma_otel_spans'][] = $span;
        $idx = count($GLOBALS['looma_otel_spans']) - 1;

        return [
            'idx' => $idx,
            'trace_id_hex' => $traceIdHex,
            'span_id_hex' => $spanIdHex,
            'flags' => $flags,
        ];
    }

    function looma_otel_end_span($ctx, $attrs = [], $statusCode = 0) {
        if (!$ctx || !is_array($ctx)) return;
        $idx = $ctx['idx'] ?? null;
        if (!is_int($idx)) return;
        if (!isset($GLOBALS['looma_otel_spans'][$idx])) return;

        $span = $GLOBALS['looma_otel_spans'][$idx];
        $span['endTimeUnixNano'] = looma_otel_now_nanos();
        if (is_array($attrs) && $attrs) {
            $span['attributes'] = array_merge($span['attributes'] ?? [], looma_otel_build_attrs($attrs));
        }
        $span['status'] = ['code' => (int) $statusCode];
        $GLOBALS['looma_otel_spans'][$idx] = $span;
    }

    function looma_otel_traceparent_for_span($ctx) {
        if (!$ctx || !is_array($ctx)) return null;
        $traceIdHex = $ctx['trace_id_hex'] ?? null;
        $spanIdHex  = $ctx['span_id_hex'] ?? null;
        if (!$traceIdHex || !$spanIdHex) return null;
        $flags = $ctx['flags'] ?? '01';
        return looma_otel_format_traceparent($traceIdHex, $spanIdHex, $flags);
    }

    function looma_otel_bootstrap() {
        if (getenv('OTEL_DISABLED') === '1') return;
        if (php_sapi_name() === 'cli') return;

        $startNanos = looma_otel_now_nanos();
        $incoming = looma_otel_parse_traceparent($_SERVER['HTTP_TRACEPARENT'] ?? '');

        $traceIdHex = $incoming ? $incoming['trace_id_hex'] : looma_otel_random_hex(16);
        $rootSpanIdHex = looma_otel_random_hex(8);
        $flags = $incoming ? $incoming['flags'] : '01';

        $traceIdB64 = looma_otel_hex_to_b64($traceIdHex);
        $rootSpanIdB64 = looma_otel_hex_to_b64($rootSpanIdHex);
        if ($traceIdB64 === null || $rootSpanIdB64 === null) return;

        $parentSpanIdB64 = null;
        if ($incoming && isset($incoming['parent_span_id_hex'])) {
            $parentSpanIdB64 = looma_otel_hex_to_b64($incoming['parent_span_id_hex']);
        }

        $service    = getenv('OTEL_SERVICE_NAME') ?: 'looma-web';
        $endpoint   = rtrim(getenv('OTEL_EXPORTER_OTLP_ENDPOINT') ?: 'http://looma-otel-collector:4318', '/');
        $tracesUrl  = $endpoint . '/v1/traces';

        // Keep legacy names for existing code that might read these.
        $GLOBALS['looma_otel_trace_id'] = $traceIdHex;
        $GLOBALS['looma_otel_span_id']  = $rootSpanIdHex;

        $GLOBALS['looma_otel_trace_id_hex'] = $traceIdHex;
        $GLOBALS['looma_otel_trace_id_b64'] = $traceIdB64;
        $GLOBALS['looma_otel_root_span_id_hex'] = $rootSpanIdHex;
        $GLOBALS['looma_otel_root_span_id_b64'] = $rootSpanIdB64;
        $GLOBALS['looma_otel_trace_flags'] = $flags;
        $GLOBALS['looma_otel_traceparent'] = looma_otel_format_traceparent($traceIdHex, $rootSpanIdHex, $flags);

        if (!headers_sent()) {
            header('traceparent: ' . $GLOBALS['looma_otel_traceparent']);
            header('X-Trace-Id: ' . $traceIdHex);
            header('X-Span-Id: ' . $rootSpanIdHex);
        }

        if (!isset($GLOBALS['looma_otel_spans']) || !is_array($GLOBALS['looma_otel_spans'])) {
            $GLOBALS['looma_otel_spans'] = [];
        }

        register_shutdown_function(function () use ($startNanos, $traceIdB64, $rootSpanIdB64, $parentSpanIdB64, $service, $tracesUrl) {
            $endNanos = looma_otel_now_nanos();

            $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
            $uri    = $_SERVER['REQUEST_URI']    ?? '/';
            $route  = strtok($uri, '?') ?: '/';
            $status = function_exists('http_response_code') ? (http_response_code() ?: 0) : 0;

            $statusCode = ($status >= 500) ? 2 : 0; // 2 = ERROR, 0 = UNSET

            $rootSpan = [
                'traceId'           => $traceIdB64,
                'spanId'            => $rootSpanIdB64,
                'name'              => $method . ' ' . $route,
                'kind'              => 2, // SERVER
                'startTimeUnixNano' => $startNanos,
                'endTimeUnixNano'   => $endNanos,
                'attributes' => array_merge(
                    [
                        ['key' => 'http.request.method', 'value' => ['stringValue' => $method]],
                        ['key' => 'url.path',            'value' => ['stringValue' => $route]],
                        ['key' => 'http.route',          'value' => ['stringValue' => $route]],
                        ['key' => 'http.response.status_code', 'value' => ['intValue' => (string) $status]],
                        ['key' => 'server.address',      'value' => ['stringValue' => $_SERVER['SERVER_NAME'] ?? 'unknown']],
                        ['key' => 'user_agent.original', 'value' => ['stringValue' => $_SERVER['HTTP_USER_AGENT'] ?? '']],
                    ],
                    looma_otel_build_attrs($GLOBALS['looma_otel_root_extra_attrs'] ?? [])
                ),
                'status' => ['code' => $statusCode],
            ];
            if ($parentSpanIdB64) {
                $rootSpan['parentSpanId'] = $parentSpanIdB64;
            }

            $spans = [$rootSpan];
            if (isset($GLOBALS['looma_otel_spans']) && is_array($GLOBALS['looma_otel_spans']) && $GLOBALS['looma_otel_spans']) {
                foreach ($GLOBALS['looma_otel_spans'] as $s) {
                    if (is_array($s)) $spans[] = $s;
                }
            }

            $payload = [
                'resourceSpans' => [[
                    'resource' => [
                        'attributes' => [
                            ['key' => 'service.name',           'value' => ['stringValue' => $service]],
                            ['key' => 'service.namespace',      'value' => ['stringValue' => 'looma']],
                            ['key' => 'service.version',        'value' => ['stringValue' => getenv('LOOMA_VERSION') ?: 'dev']],
                            ['key' => 'deployment.environment', 'value' => ['stringValue' => getenv('LOOMA_ENV') ?: 'looma']],
                        ],
                    ],
                    'scopeSpans' => [[
                        'scope' => ['name' => 'looma-web.php'],
                        'spans' => $spans,
                    ]],
                ]],
            ];

            $body = json_encode($payload);
            if ($body === false) return;

            // Best-effort POST with one retry — the collector can be slow on
            // first request after a restart and we don't want to lose the
            // shutdown-flushed spans. We still cap at ~2 s total so the user
            // never sees a stalled response.
            $send = function ($body, $tracesUrl) {
                if (function_exists('curl_init')) {
                    $ch = curl_init($tracesUrl);
                    curl_setopt_array($ch, [
                        CURLOPT_POST           => true,
                        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
                        CURLOPT_POSTFIELDS     => $body,
                        CURLOPT_RETURNTRANSFER => true,
                        CURLOPT_TIMEOUT_MS     => 1500,
                        CURLOPT_CONNECTTIMEOUT_MS => 500,
                    ]);
                    $resp = @curl_exec($ch);
                    $code = @curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    @curl_close($ch);
                    return ($resp !== false) && ($code >= 200) && ($code < 300);
                }
                $context = stream_context_create([
                    'http' => [
                        'method' => 'POST',
                        'header' => "Content-Type: application/json\r\n",
                        'content' => $body,
                        'timeout' => 1.5,
                        'ignore_errors' => true,
                    ],
                ]);
                $resp = @file_get_contents($tracesUrl, false, $context);
                return $resp !== false;
            };
            if (!$send($body, $tracesUrl)) {
                // Single fast retry — collector occasionally drops the first
                // connection right after a container restart.
                usleep(150_000); // 150 ms
                $send($body, $tracesUrl);
            }

            if (getenv('OTEL_LOGS_EXPORTER') === 'otlp') {
                $logsUrl = preg_replace('#/v1/traces$#', '/v1/logs', $tracesUrl);
                $logPayload = [
                    'resourceLogs' => [[
                        'resource' => [
                            'attributes' => [
                                ['key' => 'service.name',           'value' => ['stringValue' => $service]],
                                ['key' => 'service.namespace',      'value' => ['stringValue' => 'looma']],
                                ['key' => 'service.version',        'value' => ['stringValue' => getenv('LOOMA_VERSION') ?: 'dev']],
                                ['key' => 'deployment.environment', 'value' => ['stringValue' => getenv('LOOMA_ENV') ?: 'looma']],
                            ],
                        ],
                        'scopeLogs' => [[
                            'scope' => ['name' => 'looma-web.php'],
                            'logRecords' => [[
                                'timeUnixNano' => $endNanos,
                                'traceId' => $traceIdB64,
                                'spanId' => $rootSpanIdB64,
                                'severityText' => ($status >= 500) ? 'ERROR' : (($status >= 400) ? 'WARN' : 'INFO'),
                                'body' => ['stringValue' => $method . ' ' . $route . ' ' . $status],
                                'attributes' => [
                                    ['key' => 'trace_id', 'value' => ['stringValue' => $GLOBALS['looma_otel_trace_id_hex']]],
                                    ['key' => 'span_id',  'value' => ['stringValue' => $GLOBALS['looma_otel_root_span_id_hex']]],
                                    ['key' => 'http.request.method', 'value' => ['stringValue' => $method]],
                                    ['key' => 'url.path', 'value' => ['stringValue' => $route]],
                                    ['key' => 'http.response.status_code', 'value' => ['intValue' => (string)$status]],
                                    ['key' => 'event.name', 'value' => ['stringValue' => 'looma.http.request']],
                                ],
                            ]],
                        ]],
                    ]],
                ];
                $logBody = json_encode($logPayload);
                if ($logBody !== false) {
                    $send($logBody, $logsUrl);
                }
            }
        });
    }
}

looma_otel_bootstrap();

if (!function_exists('looma_trace_page')) {
    /**
     * Tag the in-flight server span with Looma-specific dimensions so trace
     * search / Grafana RED dashboards can slice by page, grade, subject and
     * chapter without having to grep span attributes.
     *
     * Pages call this once near the top after parsing $_REQUEST.
     *
     * Example:
     *   looma_trace_page('dictionary', [
     *       'language' => $_GET['lang'] ?? 'en',
     *       'word'     => $_GET['word'] ?? null,
     *   ]);
     */
    function looma_trace_page($page, array $attrs = []) {
        if (getenv('OTEL_DISABLED') === '1') return;
        try {
            $base = [
                'looma.page'  => (string)$page,
                'http.route'  => '/' . trim((string)$page, '/'),
            ];
            foreach (['grade', 'class', 'subject', 'language', 'lang',
                      'chapter_id', 'ch_id', 'ch', 'fp', 'fn',
                      'word', 'collection', 'cmd'] as $k) {
                if (!isset($_REQUEST[$k])) continue;
                $v = $_REQUEST[$k];
                if (is_array($v)) $v = reset($v);
                if ($v === null || $v === '') continue;
                $base['looma.' . $k] = (string)$v;
            }
            foreach ($attrs as $k => $v) {
                if ($v === null || $v === '') continue;
                $base['looma.' . $k] = is_scalar($v) ? (string)$v : (string)json_encode($v);
            }
            // Apply to the root span by ending a zero-duration helper span with
            // the same attributes — the shutdown handler also renders root span.
            if (function_exists('looma_otel_start_span') && function_exists('looma_otel_end_span')) {
                $ctx = looma_otel_start_span('looma.page.' . $page, $base, 1);
                if ($ctx) looma_otel_end_span($ctx, [], 0);
            }
            // Mirror the canonical attributes onto the root span so spanmetrics
            // dimensions are populated.
            if (isset($GLOBALS['looma_otel_spans']) && is_array($GLOBALS['looma_otel_spans'])) {
                $GLOBALS['looma_otel_root_extra_attrs'] = isset($GLOBALS['looma_otel_root_extra_attrs'])
                    ? array_merge($GLOBALS['looma_otel_root_extra_attrs'], $base)
                    : $base;
            }
        } catch (Throwable $e) { /* never let tracing break a page */ }
    }

    /**
     * Wrap a chunk of work in a child span. Returns whatever $callable returns.
     *
     *   $rows = looma_trace_with('mongo.lookup_word', ['word' => $w], function() use ($coll, $w) {
     *       return mongoFindOne($coll, ['en' => $w]);
     *   });
     */
    function looma_trace_with($name, array $attrs, callable $callable) {
        if (getenv('OTEL_DISABLED') === '1') return $callable();
        $ctx = function_exists('looma_otel_start_span')
            ? looma_otel_start_span((string)$name, $attrs, 1)
            : null;
        $err = null; $status = 0;
        try {
            $r = $callable();
        } catch (Throwable $e) {
            $err = $e; $status = 2;
        } finally {
            if ($ctx && function_exists('looma_otel_end_span')) {
                $end = [];
                if ($err) $end['exception.message'] = $err->getMessage();
                looma_otel_end_span($ctx, $end, $status);
            }
        }
        if ($err) throw $err;
        return $r;
    }

    /**
     * Add an Event-style log entry to the in-flight trace. Useful for
     * fine-grained markers like "cache miss", "fallback to FTS", etc.
     */
    function looma_trace_event($name, array $attrs = []) {
        if (getenv('OTEL_DISABLED') === '1') return;
        try {
            $ctx = function_exists('looma_otel_start_span')
                ? looma_otel_start_span('event.' . $name, $attrs, 1)
                : null;
            if ($ctx && function_exists('looma_otel_end_span')) {
                looma_otel_end_span($ctx, [], 0);
            }
        } catch (Throwable $e) { /* swallow */ }
    }
}

?>
