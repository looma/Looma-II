<?php
/*
    Looma — list the Piper voices installed on this box.

    Usage:  looma-TTS-voices.php            (JSON)
            looma-TTS-voices.php?refresh=1  (rescan the voice directory first)

    The Reading Settings page builds its English/Nepali voice dropdowns from
    this, instead of hard-coding one voice per language: whatever models are on
    the box show up, and multi-speaker models (the Nepali ne_NP-google models
    carry 18 speakers) are listed one selectable voice per speaker.

    The browser cannot call the Piper Flask server directly — 127.0.0.1:5002 is
    the *server's* loopback, not the tablet's — so this proxies it, exactly like
    looma-TTS.php does for synthesis.
*/

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$refresh = (isset($_REQUEST["refresh"]) && $_REQUEST["refresh"] === "1") ? "?refresh=1" : "";

// Same address as looma-TTS.php uses: loopback when Piper runs inside looma-web,
// or LOOMA_PIPER_URL when it is a container/service of its own.
$piperBase = getenv("LOOMA_PIPER_URL");
$piperBase = $piperBase ? rtrim($piperBase, "/") : "http://127.0.0.1:5002";

$voicesUrl = $piperBase . "/voices" . $refresh;

// Falls back to the two built-in defaults so the settings page still works (with
// one voice per language) when Piper is down or too old to know /voices.
function looma_tts_voices_fallback($reason)
{
    http_response_code(200);
    echo json_encode([
        "ok" => false,
        "error" => $reason,
        "defaults" => ["en" => "en_US-amy-low.onnx", "ne" => "ne_NP-google-x_low.onnx"],
        "voices" => [
            [
                "id" => "en_US-amy-low.onnx",
                "language" => "en",
                "label" => "English (en_US) — amy (fast)",
                "default" => true,
            ],
            [
                "id" => "ne_NP-google-x_low.onnx",
                "language" => "ne",
                "label" => "Nepali (ne_NP) — google (fastest)",
                "default" => true,
            ],
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (function_exists("curl_init")) {
    $ch = curl_init($voicesUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 10,
    ]);
    $body     = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    if ($body === false || $httpCode >= 400) {
        looma_tts_voices_fallback($error ?: ("Piper returned HTTP " . $httpCode));
    }

    echo $body;
    exit;
}

$context = stream_context_create(["http" => ["method" => "GET", "timeout" => 10, "ignore_errors" => true]]);
$body = @file_get_contents($voicesUrl, false, $context);

if ($body === false) {
    looma_tts_voices_fallback("Unable to contact the Piper server on " . $piperBase);
}

echo $body;
