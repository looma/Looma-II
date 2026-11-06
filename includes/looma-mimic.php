<?php
/*
    Looma — Mimic (MycroftAI mimic1) text-to-speech: an English-only, offline
    engine that runs as a local binary with .flitevox voice files.

    Used by looma-TTS.php (synthesis) and looma-TTS-voices.php (voice list).
    Unlike Piper it is not a server, so there is nothing to keep warm.

    Where it looks, so that a box installed the old way just works:
        binary: $LOOMA_MIMIC_BIN, /usr/local/bin/mimic, /usr/bin/mimic
        voices: $LOOMA_MIMIC_VOICE_DIR, ../voices, ../mimic/voices
*/

// Good general-purpose voice, and what Looma has historically used.
define('LOOMA_MIMIC_DEFAULT_VOICE', 'cmu_us_aup');
define('LOOMA_MIMIC_TIMEOUT_SECONDS', 60);
define('LOOMA_MIMIC_MAX_TEXT_CHARS', 5000);

function looma_mimic_binary() {
    $candidates = [getenv('LOOMA_MIMIC_BIN') ?: '', '/usr/local/bin/mimic', '/usr/bin/mimic'];
    foreach ($candidates as $candidate) {
        if ($candidate !== '' && @is_executable($candidate)) return $candidate;
    }
    return null;
}

function looma_mimic_voice_dir() {
    $webRoot = dirname(__DIR__, 2);
    $candidates = [getenv('LOOMA_MIMIC_VOICE_DIR') ?: '', $webRoot . '/voices', $webRoot . '/mimic/voices'];
    foreach ($candidates as $candidate) {
        if ($candidate !== '' && glob($candidate . '/*.flitevox')) return $candidate;
    }
    return null;
}

// Voice ids installed on this box (file names without .flitevox), sorted.
// Empty when Mimic cannot run here at all, so callers need only this one check.
function looma_mimic_voices() {
    $dir = looma_mimic_voice_dir();
    if ($dir === null || looma_mimic_binary() === null) return [];
    $voices = array_map(function ($path) {
        return basename($path, '.flitevox');
    }, glob($dir . '/*.flitevox'));
    sort($voices);
    return $voices;
}

// The requested voice if it is installed, else the default, else the first one.
// Matching against the installed list is also what keeps the id off the filesystem.
function looma_mimic_pick_voice($requested, array $installed) {
    if (in_array($requested, $installed, true)) return $requested;
    if (in_array(LOOMA_MIMIC_DEFAULT_VOICE, $installed, true)) return LOOMA_MIMIC_DEFAULT_VOICE;
    return $installed[0] ?? null;
}

/* Synthesize $text with an installed $voice to a temporary WAV.
 * $rate is Looma's reading speed (rate > 1 is faster); mimic stretches duration,
 * so 2/3 speed is a stretch of 1.5.
 * Returns ['wav' => path] (the caller deletes it) or ['error' => message].
 * The command is passed as an array, so no shell ever sees the text. */
function looma_mimic_synthesize($text, $voice, $rate) {
    $wav = tempnam(sys_get_temp_dir(), 'looma_mimic_');
    if ($wav === false) return ['error' => 'Could not create a temporary file'];

    $command = [
        looma_mimic_binary(),
        '-t', $text,
        '--setf', 'duration_stretch=' . round(1 / $rate, 3),
        '-voice', looma_mimic_voice_dir() . '/' . $voice . '.flitevox',
        '-o', $wav,
    ];
    $process = proc_open($command, [0 => ['file', '/dev/null', 'r'],
                                    1 => ['file', '/dev/null', 'w'],
                                    2 => ['file', '/dev/null', 'w']], $pipes);
    if (!is_resource($process)) {
        @unlink($wav);
        return ['error' => 'Could not start mimic'];
    }

    // PHP's own time limit does not count time spent in a child process, so a
    // hung mimic would hold this Apache worker forever without this.
    $deadline = microtime(true) + LOOMA_MIMIC_TIMEOUT_SECONDS;
    $status = proc_get_status($process);
    while ($status['running'] && microtime(true) < $deadline) {
        usleep(20000);
        $status = proc_get_status($process);
    }
    if ($status['running']) {
        proc_terminate($process, 9);
        proc_close($process);
        @unlink($wav);
        return ['error' => 'mimic timed out'];
    }
    proc_close($process);

    clearstatcache(true, $wav);
    if ($status['exitcode'] !== 0 || @filesize($wav) <= 44) {   // 44 = an empty WAV's header
        @unlink($wav);
        return ['error' => 'mimic failed (exit code ' . $status['exitcode'] . ')'];
    }
    return ['wav' => $wav];
}
