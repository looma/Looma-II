<?php
/*
    Author: Akshay Srivatsan
    Date: July 8, 2016
    Updated: MAR 2026 for Piper-over-Flask integration

    Usage:
        looma-TTS.php?text=TEXT&voice=VOICE&engine=ENGINE&lang=LANGUAGE&rate=RATE

    This file keeps the existing Looma frontend contract, but delegates synthesis
    to the local Flask server that wraps Piper.
*/

header("Access-Control-Allow-Origin: *");

// Optional OpenTelemetry spans + trace propagation (no-op if disabled).
require_once(__DIR__ . "/includes/otel.php");

// Tracing is OPTIONAL — but these helpers were being called unguarded, so a shim
// that did not define them killed TTS outright with a fatal error. That is not
// hypothetical: includes/otel.php defines everything inside
// `if (!function_exists('looma_otel_bootstrap'))`, so when another (older) shim
// is loaded first — the dev stack auto-prepends one via php.ini — the whole
// block is skipped and these three never exist. Speech must not depend on
// telemetry, so fall back to no-ops.
if (!function_exists('looma_otel_start_span')) {
    function looma_otel_start_span($name, $attributes = array(), $kind = 1) { return null; }
}
if (!function_exists('looma_otel_end_span')) {
    function looma_otel_end_span($span, $attributes = array(), $statusCode = 0) { }
}
if (!function_exists('looma_otel_traceparent_for_span')) {
    function looma_otel_traceparent_for_span($span) { return null; }
}

if (function_exists('looma_trace_page')) {
    looma_trace_page('tts', [
        'engine' => $_REQUEST['engine'] ?? null,
        'voice'  => $_REQUEST['voice']  ?? null,
        'lang'   => $_REQUEST['lang']   ?? null,
        'rate'   => $_REQUEST['rate']   ?? null,
        'len'    => isset($_REQUEST['text']) ? strlen((string)$_REQUEST['text']) : 0,
    ]);
}

$text = isset($_REQUEST["text"]) ? trim((string) $_REQUEST["text"]) : "";
if ($text === "") {
    http_response_code(400);
    header("Content-Type: application/json");
    echo json_encode(["error" => "Missing text"]);
    exit;
}

// Piper is the ONLY server-side TTS engine (local, offline, all languages), so
// this endpoint always synthesizes with Piper and any `engine` parameter is
// ignored. The other supported engine, ResponsiveVoice, is cloud TTS that runs
// entirely client-side (js/looma-utilities.js) and never reaches this file.
$engine = "piper";

$requestedLang = isset($_REQUEST["lang"]) ? strtolower(trim((string) $_REQUEST["lang"])) : "";

// Looma sometimes sends "english"/"native" rather than "en"/"ne".
if ($requestedLang === "english" || $requestedLang === "en") {
    $language = "en";
} else if ($requestedLang === "native" || $requestedLang === "ne" || $requestedLang === "np") {
    $language = "ne";
} else if (preg_match('/\p{Devanagari}/u', $text)) {
    $language = "ne";
} else {
    $language = "en";
}

$ttsRequest = [
    "text" => $text,
    "language" => $language,
];

// Reading speed. The frontend sends a Looma "rate" (rate > 1 is faster); the
// Piper server converts it to a length_scale. This used to be read only for the
// trace attributes above and never forwarded, so the speed chosen on the
// Reading Settings page had no effect on Piper at all.
if (isset($_REQUEST["rate"]) && is_numeric($_REQUEST["rate"])) {
    $rate = (float) $_REQUEST["rate"];
    if ($rate > 0 && $rate <= 2) {
        $ttsRequest["rate"] = $rate;
    }
}

// An explicit Piper voice (picked on the Reading Settings page) overrides the
// server's language-based default. A voice id is a model filename, optionally
// followed by "#<speaker>" for a multi-speaker model — the Nepali ne_NP-google
// models carry 18 speakers, and each one is selectable on its own. Only forward
// a safe id: no path separators, no "..".
$requestedVoice = isset($_REQUEST["voice"]) ? trim((string) $_REQUEST["voice"]) : "";
if ($requestedVoice !== ""
    && preg_match('/^[A-Za-z0-9_.+-]+(#\d{1,4})?$/', $requestedVoice)
    && strpos($requestedVoice, "..") === false) {
    $ttsRequest["voice"] = $requestedVoice;
}

$payload = json_encode($ttsRequest, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

if ($payload === false) {
    http_response_code(500);
    header("Content-Type: application/json");
    echo json_encode(["error" => "Failed to encode TTS request"]);
    exit;
}

// Where the Piper Flask server listens. It runs INSIDE looma-web in the packaged
// deployments (hence the loopback default), but it can also be its own container
// or host service — the dev stack runs it as `looma-piper` — so the address is
// configurable instead of hard-coded.
$piperBase = getenv("LOOMA_PIPER_URL");
$piperBase = $piperBase ? rtrim($piperBase, "/") : "http://127.0.0.1:5002";

$ttsUrl = $piperBase . "/tts";
$healthUrl = $piperBase . "/health";

// Prefer curl when available because it gives us response headers/status cleanly.
if (function_exists("curl_init")) {
    $piperSpan = looma_otel_start_span(
        "tts.piper",
        [
            "tts.engine" => "piper",
            "tts.language" => $language,
            "tts.text_chars" => strlen($text),
            "url.full" => $ttsUrl,
            "http.request.method" => "POST",
        ],
        3 // CLIENT
    );
    $traceparent = looma_otel_traceparent_for_span($piperSpan);

    $httpHeaders = [
        "Content-Type: application/json",
        "Content-Length: " . strlen($payload),
    ];
    if ($traceparent) {
        $httpHeaders[] = "traceparent: " . $traceparent;
    }

    $ch = curl_init($ttsUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $httpHeaders,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 120,
        CURLOPT_HEADER => true,
    ]);

    $t0 = microtime(true);
    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);

    looma_otel_end_span(
        $piperSpan,
        [
            "http.response.status_code" => $httpCode,
            "tts.duration_ms" => (int) round((microtime(true) - $t0) * 1000),
            "error.message" => $curlError ? (string) $curlError : "",
        ],
        ($response === false || $httpCode >= 500) ? 2 : 0
    );

    if ($response === false) {
        http_response_code(502);
        header("Content-Type: application/json");
        echo json_encode([
            "error" => "Unable to contact Piper server",
            "details" => $curlError,
            "server" => $healthUrl,
        ]);
        exit;
    }

    $rawHeaders = substr($response, 0, $headerSize);
    $body = substr($response, $headerSize);
    $contentType = "audio/wav";
    $ttsHeaders = [];

    foreach (explode("\r\n", $rawHeaders) as $headerLine) {
        if (stripos($headerLine, "Content-Type:") === 0) {
            $contentType = trim(substr($headerLine, strlen("Content-Type:")));
        } else if (stripos($headerLine, "X-Looma-TTS-") === 0) {
            // Pass Piper's own diagnostics through: which voice actually spoke,
            // whether it came from the cache, and how long synthesis took. They
            // are what makes a slow or wrong-voiced Speak press explainable from
            // the browser's network panel instead of only from the server logs.
            $ttsHeaders[] = trim($headerLine);
        }
    }

    http_response_code($httpCode > 0 ? $httpCode : 200);
    header("Content-Type: " . $contentType);
    foreach ($ttsHeaders as $headerLine) {
        header($headerLine);
    }
    echo $body;
    exit;
}

// Fallback when the curl extension is not enabled.
$piperSpan = looma_otel_start_span(
    "tts.piper",
    [
        "tts.engine" => "piper",
        "tts.language" => $language,
        "tts.text_chars" => strlen($text),
        "url.full" => $ttsUrl,
        "http.request.method" => "POST",
    ],
    3 // CLIENT
);
$traceparent = looma_otel_traceparent_for_span($piperSpan);

$headerLines = [
    "Content-Type: application/json",
    "Content-Length: " . strlen($payload),
];
if ($traceparent) {
    $headerLines[] = "traceparent: " . $traceparent;
}

$context = stream_context_create([
    "http" => [
        "method" => "POST",
        "header" => implode("\r\n", $headerLines),
        "content" => $payload,
        "timeout" => 120,
        "ignore_errors" => true,
    ],
]);

$t0 = microtime(true);
$response = @file_get_contents($ttsUrl, false, $context);
if ($response === false) {
    looma_otel_end_span(
        $piperSpan,
        [
            "http.response.status_code" => 0,
            "tts.duration_ms" => (int) round((microtime(true) - $t0) * 1000),
        ],
        2
    );
    http_response_code(502);
    header("Content-Type: application/json");
    echo json_encode([
        "error" => "Unable to contact Piper server",
        "server" => $healthUrl,
    ]);
    exit;
}

$contentType = "audio/wav";
$statusCode = 200;

if (isset($http_response_header) && is_array($http_response_header)) {
    foreach ($http_response_header as $headerLine) {
        if (preg_match('#^HTTP/\S+\s+(\d{3})#', $headerLine, $matches)) {
            $statusCode = (int) $matches[1];
        } else if (stripos($headerLine, "Content-Type:") === 0) {
            $contentType = trim(substr($headerLine, strlen("Content-Type:")));
        }
    }
}

looma_otel_end_span(
    $piperSpan,
    [
        "http.response.status_code" => $statusCode,
        "tts.duration_ms" => (int) round((microtime(true) - $t0) * 1000),
    ],
    ($statusCode >= 500) ? 2 : 0
);

http_response_code($statusCode);
header("Content-Type: " . $contentType);
echo $response;
?>
