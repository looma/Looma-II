<?php
/*
    Author: Akshay Srivatsan
    Date: July 8, 2016
    Updated: MAR 2026 for Piper-over-Flask integration

    Usage:
        looma-TTS.php?text=TEXT&voice=VOICE&engine=ENGINE&lang=LANGUAGE&rate=RATE

    This file keeps the existing Looma frontend contract. Piper, the default,
    is delegated to the local Flask server that wraps it; engine=mimic runs the
    local Mimic binary instead (includes/looma-mimic.php).
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

// Two engines run on the server: Piper (local, offline, all languages — the
// default) and Mimic (local, offline, English only). The third, the browser's
// speechSynthesis, runs entirely client-side (js/looma-utilities.js) and never
// reaches this file.
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

// Mimic cannot read Nepali, so Nepali text goes to Piper whatever was asked for.
if (isset($_REQUEST["engine"]) && $_REQUEST["engine"] === "mimic" && $language === "en") {
    $engine = "mimic";
}

if ($engine === "mimic") {
    require_once(__DIR__ . "/includes/looma-mimic.php");

    $mimicVoices = looma_mimic_voices();
    $mimicVoice = looma_mimic_pick_voice(isset($_REQUEST["voice"]) ? (string) $_REQUEST["voice"] : "", $mimicVoices);
    $mimicRate = (isset($_REQUEST["rate"]) && is_numeric($_REQUEST["rate"])
                  && (float) $_REQUEST["rate"] > 0 && (float) $_REQUEST["rate"] <= 2)
        ? (float) $_REQUEST["rate"] : 2 / 3;

    // A failure here is not a dead end: LOOMA.speak reads the sentence with Piper.
    $mimicFail = function ($code, $message) {
        http_response_code($code);
        header("Content-Type: application/json");
        echo json_encode(["error" => $message]);
        exit;
    };
    if ($mimicVoice === null) $mimicFail(503, "Mimic is not installed on this server");
    if (strlen($text) > LOOMA_MIMIC_MAX_TEXT_CHARS) $mimicFail(413, "Text too long for Mimic");

    $mimicSpan = looma_otel_start_span("tts.mimic", [
        "tts.engine" => "mimic",
        "tts.voice" => $mimicVoice,
        "tts.language" => $language,
        "tts.rate" => $mimicRate,
        "tts.text_chars" => strlen($text),
    ]);
    $t0 = microtime(true);
    $mimicResult = looma_mimic_synthesize($text, $mimicVoice, $mimicRate);
    $mimicMs = (int) round((microtime(true) - $t0) * 1000);
    $mimicError = $mimicResult["error"] ?? "";
    looma_otel_end_span($mimicSpan, [
        "tts.duration_ms" => $mimicMs,
        "error.message" => $mimicError,
    ], $mimicError ? 2 : 0);

    if ($mimicError) $mimicFail(502, $mimicError);

    header("Content-Type: audio/wav");
    header("Content-Length: " . filesize($mimicResult["wav"]));
    header("X-Looma-TTS-Engine: mimic");
    header("X-Looma-TTS-Voice: " . $mimicVoice);
    header("X-Looma-TTS-Duration-Ms: " . $mimicMs);
    readfile($mimicResult["wav"]);
    @unlink($mimicResult["wav"]);
    exit;
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

    // The Piper image carries no OpenTelemetry, so what Piper reports in its
    // response headers is the only way a trace can show cache use and synthesis time.
    $piperAttrs = [];
    $piperHeaders = $response === false ? "" : substr($response, 0, $headerSize);
    if (preg_match('/^X-Looma-TTS-Cache:\s*(hit|miss)/mi', $piperHeaders, $m)) {
        $piperAttrs["piper.cache_hit"] = strtolower($m[1]) === "hit";
    }
    if (preg_match('/^X-Looma-TTS-Voice:\s*(\S+)/mi', $piperHeaders, $m)) {
        $piperAttrs["piper.voice"] = $m[1];
    }
    if (preg_match('/^X-Looma-TTS-Ms:\s*(\d+)/mi', $piperHeaders, $m)) {
        $piperAttrs["piper.duration_ms"] = (int) $m[1];
    }

    looma_otel_end_span(
        $piperSpan,
        $piperAttrs + [
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
