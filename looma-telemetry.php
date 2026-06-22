<?php
/*
 * looma-telemetry.php
 *
 * Single ingest endpoint for learning telemetry from the browser:
 *   - game / exercise / exam scores       (event=score)
 *   - chapter time-spent on the PDF viewer (event=chapter_time)
 *   - page hits enriched with grade/subject/chapter (event=page)
 *   - dictionary lookups (event=dictionary)
 *
 * Persists every event to MongoDB (db=activitylog, collection=events) and
 * mirrors it into the existing OpenTelemetry Collector as an OTLP log + a
 * counter/histogram metric so Prometheus + OpenSearch (and therefore Grafana)
 * pick it up without app changes.
 *
 * Accepts: POST application/json
 *   { event: "score"|"chapter_time"|"page",
 *     activity?: "game"|"exercise"|"exam",
 *     grade?: "1".."10", subject?: "math|english|...",
 *     chapter_id?: "1EN1", chapter_name?: "...", language?: "en"|"np",
 *     score?: 0..1, correct?: int, total?: int,
 *     duration_ms?: int, page?: int|string, weak_topics?: [string] }
 */

require_once 'includes/mongo-connect.php';
require_once 'includes/otel.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'POST required']);
    exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw ?: '{}', true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

$event = strtolower(trim((string)($payload['event'] ?? '')));
// `tts_speak` / `tts_config` carry the data behind the TTS Grafana dashboards
// (engine, voice, language, rate, status, source) so every Speak button click
// and every Reading-Settings change shows up alongside the OTel span metrics.
$allowed_events = ['score', 'chapter_time', 'page', 'dictionary', 'tts_speak', 'tts_config'];
if (!in_array($event, $allowed_events, true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'event must be one of '. implode(',', $allowed_events)]);
    exit;
}

$activity     = strtolower(trim((string)($payload['activity']     ?? '')));
$grade        = trim((string)($payload['grade']        ?? ''));
$subject      = strtolower(trim((string)($payload['subject']      ?? '')));
$chapter_id   = trim((string)($payload['chapter_id']   ?? ''));
$chapter_name = trim((string)($payload['chapter_name'] ?? ''));
$language     = strtolower(trim((string)($payload['language']     ?? '')));
$page         = trim((string)($payload['page']         ?? ''));

$score        = isset($payload['score'])       ? (float)$payload['score']     : null;
$correct      = isset($payload['correct'])     ? (int)$payload['correct']     : null;
$total        = isset($payload['total'])       ? (int)$payload['total']       : null;
$duration_ms  = isset($payload['duration_ms']) ? (int)$payload['duration_ms'] : null;
$weak_topics  = isset($payload['weak_topics']) && is_array($payload['weak_topics']) ? $payload['weak_topics'] : [];

// TTS fields — populated when the event is `tts_speak` or `tts_config`. Kept
// snake_case so they map 1:1 to OTel attributes (looma.tts_*) on the way out.
$tts_engine     = trim((string)($payload['tts_engine']     ?? ''));
$tts_voice      = trim((string)($payload['tts_voice']      ?? ''));
$tts_language   = strtolower(trim((string)($payload['tts_language'] ?? '')));
$tts_text_chars = isset($payload['tts_text_chars']) ? (int)$payload['tts_text_chars']   : null;
$tts_rate       = isset($payload['tts_rate'])       ? (float)$payload['tts_rate']       : null;
$tts_source     = trim((string)($payload['tts_source']     ?? ''));
$tts_status     = strtolower(trim((string)($payload['tts_status']   ?? '')));
$tts_error      = trim((string)($payload['tts_error']      ?? ''));

// Best-effort enrichment: many browser calls don't include grade/subject/chapter context.
// Try to infer missing fields from the page URL (HTTP_REFERER) so we can slice dashboards by
// year/discipline/chapter without changing callers.
$inferred = looma_telemetry_infer_context($_SERVER['HTTP_REFERER'] ?? '');
if ($activity === ''     && !empty($inferred['activity']))     $activity = $inferred['activity'];
if ($grade === ''        && !empty($inferred['grade']))        $grade = $inferred['grade'];
if ($subject === ''      && !empty($inferred['subject']))      $subject = $inferred['subject'];
if ($chapter_id === ''   && !empty($inferred['chapter_id']))   $chapter_id = $inferred['chapter_id'];
if ($chapter_name === '' && !empty($inferred['chapter_name'])) $chapter_name = $inferred['chapter_name'];
if ($language === ''     && !empty($inferred['language']))     $language = $inferred['language'];
if ($page === ''         && !empty($inferred['page']))         $page = $inferred['page'];

if ($event === 'score' && $score === null && $correct !== null && $total !== null && $total > 0) {
    $score = $correct / $total;
}
if ($score !== null) { if ($score < 0) $score = 0.0; if ($score > 1) $score = 1.0; }

$utc = time();
$doc = [
    'event'        => $event,
    'activity'     => $activity ?: null,
    'grade'        => $grade ?: null,
    'subject'      => $subject ?: null,
    'chapter_id'   => $chapter_id ?: null,
    'chapter_name' => $chapter_name ?: null,
    'language'     => $language ?: null,
    'page'         => $page !== '' ? $page : null,
    'score'        => $score,
    'correct'      => $correct,
    'total'        => $total,
    'duration_ms'  => $duration_ms,
    'weak_topics'  => $weak_topics ?: null,
    // TTS-specific (null when this isn't a tts_speak / tts_config event).
    'tts_engine'     => $tts_engine     !== '' ? $tts_engine     : null,
    'tts_voice'      => $tts_voice      !== '' ? $tts_voice      : null,
    'tts_language'   => $tts_language   !== '' ? $tts_language   : null,
    'tts_text_chars' => $tts_text_chars,
    'tts_rate'       => $tts_rate,
    'tts_source'     => $tts_source     !== '' ? $tts_source     : null,
    'tts_status'     => $tts_status     !== '' ? $tts_status     : null,
    'tts_error'      => $tts_error      !== '' ? $tts_error      : null,
    'utc'          => $utc,
    'time'         => date('Y-m-d\TH:i:s\Z', $utc),
    'ip'           => $_SERVER['REMOTE_ADDR'] ?? null,
];

// Persist to Mongo (logs DB) so the existing dashboards/queries can read it.
try {
    $events_collection = $logDB->events;
    mongoInsert($events_collection, $doc);
} catch (Throwable $e) {
    // never fail the request just because Mongo is down
}

// Mirror to OpenTelemetry Collector (logs + metrics) for Grafana via Prometheus / OpenSearch.
looma_telemetry_emit_otlp($doc);

echo json_encode(['ok' => true]);
exit;


function looma_telemetry_otlp_endpoint(): string {
    $base = getenv('OTEL_EXPORTER_OTLP_ENDPOINT') ?: 'http://looma-otel-collector:4318';
    return rtrim($base, '/');
}

function looma_telemetry_post(string $url, string $body): void {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT_MS => 1500,
            CURLOPT_CONNECTTIMEOUT_MS => 400,
        ]);
        @curl_exec($ch);
        @curl_close($ch);
        return;
    }
    $ctx = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => $body,
            'timeout' => 0.25,
            'ignore_errors' => true,
        ],
    ]);
    @file_get_contents($url, false, $ctx);
}

function looma_telemetry_infer_context(string $referer): array {
    $out = [
        'activity' => null,
        'grade' => null,
        'subject' => null,
        'chapter_id' => null,
        'chapter_name' => null,
        'language' => null,
        'page' => null,
    ];

    if ($referer === '') return $out;

    $u = @parse_url($referer);
    if (!is_array($u)) return $out;

    $query = [];
    if (!empty($u['query'])) {
        @parse_str((string)$u['query'], $query);
        if (!is_array($query)) $query = [];
    }

    $pick = function(array $keys) use ($query): ?string {
        foreach ($keys as $k) {
            if (!isset($query[$k])) continue;
            $v = $query[$k];
            if (is_array($v)) $v = reset($v);
            $v = trim((string)$v);
            if ($v !== '') return $v;
        }
        return null;
    };

    $gradeRaw = $pick(['grade', 'class', 'year', 'g']);
    if ($gradeRaw !== null) {
        $g = strtolower($gradeRaw);
        $g = preg_replace('/[^0-9]/', '', $g) ?? '';
        if ($g !== '') $out['grade'] = $g;
    }

    $subjectRaw = $pick(['subject', 'discipline', 'subj', 's']);
    if ($subjectRaw !== null) $out['subject'] = strtolower($subjectRaw);

    $chapterIdRaw = $pick(['chapter_id', 'chapter', 'ch', 'ch_id', 'chapterId', 'cid']);
    if ($chapterIdRaw !== null) $out['chapter_id'] = $chapterIdRaw;

    $chapterNameRaw = $pick(['chapter_name', 'chapterName', 'cname']);
    if ($chapterNameRaw !== null) $out['chapter_name'] = $chapterNameRaw;

    $langRaw = $pick(['language', 'lang', 'l']);
    if ($langRaw !== null) {
        $l = strtolower($langRaw);
        if (preg_match('/^[a-z]{2}(-[a-z]{2})?$/', $l)) $out['language'] = $l;
    }

    $pageRaw = $pick(['page', 'p']);
    if ($pageRaw !== null) $out['page'] = $pageRaw;

    $activityRaw = $pick(['activity', 'mode', 'type']);
    if ($activityRaw !== null) $out['activity'] = strtolower($activityRaw);

    // A few Looma pages use path-like hints (e.g. .../g4/...); do a tiny best-effort parse.
    if ($out['grade'] === null && !empty($u['path'])) {
        if (preg_match('/\\b(?:grade|class|g)(\\d{1,2})\\b/i', (string)$u['path'], $m)) {
            $out['grade'] = $m[1];
        }
    }

    return $out;
}

function looma_telemetry_resource_attrs(): array {
    return [
        ['key' => 'service.name',           'value' => ['stringValue' => getenv('OTEL_SERVICE_NAME') ?: 'looma-web']],
        ['key' => 'service.namespace',      'value' => ['stringValue' => 'looma']],
        ['key' => 'deployment.environment', 'value' => ['stringValue' => getenv('LOOMA_ENV') ?: 'local']],
    ];
}

function looma_telemetry_attrs(array $doc): array {
    $attrs = [];
    foreach (['event', 'activity', 'grade', 'subject', 'chapter_id', 'chapter_name', 'language', 'page'] as $k) {
        if (!empty($doc[$k])) {
            $attrs[] = ['key' => "looma.$k", 'value' => ['stringValue' => (string)$doc[$k]]];
        }
    }
    if ($doc['correct'] !== null)     $attrs[] = ['key' => 'looma.correct',     'value' => ['intValue' => (string)$doc['correct']]];
    if ($doc['total']   !== null)     $attrs[] = ['key' => 'looma.total',       'value' => ['intValue' => (string)$doc['total']]];
    if ($doc['score']   !== null)     $attrs[] = ['key' => 'looma.score',       'value' => ['doubleValue' => (float)$doc['score']]];
    if ($doc['duration_ms'] !== null) $attrs[] = ['key' => 'looma.duration_ms', 'value' => ['intValue' => (string)$doc['duration_ms']]];
    // TTS attributes — surface them as looma.tts_* so they become Prometheus
    // label dimensions on looma_event_total and OpenSearch log fields on the
    // logs side; the TTS Grafana dashboards filter and group on these.
    foreach (['tts_engine', 'tts_voice', 'tts_language', 'tts_source', 'tts_status', 'tts_error'] as $k) {
        if (!empty($doc[$k])) {
            $attrs[] = ['key' => "looma.$k", 'value' => ['stringValue' => (string)$doc[$k]]];
        }
    }
    if (isset($doc['tts_text_chars']) && $doc['tts_text_chars'] !== null) {
        $attrs[] = ['key' => 'looma.tts_text_chars', 'value' => ['intValue' => (string)$doc['tts_text_chars']]];
    }
    if (isset($doc['tts_rate']) && $doc['tts_rate'] !== null) {
        $attrs[] = ['key' => 'looma.tts_rate', 'value' => ['doubleValue' => (float)$doc['tts_rate']]];
    }
    return $attrs;
}

function looma_telemetry_emit_otlp(array $doc): void {
    $endpoint = looma_telemetry_otlp_endpoint();
    $resource = ['attributes' => looma_telemetry_resource_attrs()];
    $tNanos   = (string)((int)round(microtime(true) * 1e9));
    // Cumulative counters need a startTime that's strictly older than the sample;
    // without it the OTel→Prometheus exporter drops the very first data point and
    // the Grafana panels stay empty.
    $startNanos = (string)((int)$tNanos - 60_000_000_000);
    $attrs    = looma_telemetry_attrs($doc);

    // 1. Log record — flows into OpenSearch for the engagement dashboard.
    $logBody = json_encode([
        'resourceLogs' => [[
            'resource' => $resource,
            'scopeLogs' => [[
                'scope' => ['name' => 'looma-telemetry'],
                'logRecords' => [[
                    'timeUnixNano' => $tNanos,
                    'severityNumber' => 9,
                    'severityText' => 'INFO',
                    'body' => ['stringValue' => "looma.{$doc['event']}"],
                    'attributes' => $attrs,
                ]],
            ]],
        ]],
    ]);
    if ($logBody !== false) looma_telemetry_post($endpoint . '/v1/logs', $logBody);

    // 2. Metric — counters + score / duration histograms feed Prometheus.
    $metrics = [];

    $metrics[] = [
        'name' => 'looma_event_total',
        'unit' => '{event}',
        'sum'  => [
            'aggregationTemporality' => 2, // CUMULATIVE
            'isMonotonic' => true,
            'dataPoints' => [[
                'attributes'        => $attrs,
                'startTimeUnixNano' => $startNanos,
                'timeUnixNano'      => $tNanos,
                'asInt'             => '1',
            ]],
        ],
    ];

    if ($doc['event'] === 'score' && $doc['score'] !== null) {
        $metrics[] = [
            // Prometheus exporter maps unit=1 to *_ratio; make it explicit for stable dashboards.
            'name' => 'looma_score_ratio',
            'unit' => '1',
            'gauge' => [
                'dataPoints' => [[
                    'attributes'   => $attrs,
                    'timeUnixNano' => $tNanos,
                    'asDouble'     => (float)$doc['score'],
                ]],
            ],
        ];
    }
    if ($doc['event'] === 'chapter_time' && $doc['duration_ms'] !== null && $doc['duration_ms'] > 0) {
        $metrics[] = [
            'name' => 'looma_chapter_time_ms',
            'unit' => 'ms',
            'sum'  => [
                'aggregationTemporality' => 2,
                'isMonotonic' => true,
                'dataPoints' => [[
                    'attributes'        => $attrs,
                    'startTimeUnixNano' => $startNanos,
                    'timeUnixNano'      => $tNanos,
                    'asInt'             => (string)(int)$doc['duration_ms'],
                ]],
            ],
        ];
    }

    $metricsBody = json_encode([
        'resourceMetrics' => [[
            'resource' => $resource,
            'scopeMetrics' => [[
                'scope' => ['name' => 'looma-telemetry'],
                'metrics' => $metrics,
            ]],
        ]],
    ]);
    if ($metricsBody !== false) looma_telemetry_post($endpoint . '/v1/metrics', $metricsBody);
}
?>
