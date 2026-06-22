/*
 * looma-telemetry.js
 *
 * Single front-end client for the learning telemetry pipeline.
 * Exposes:
 *   LOOMA.telemetry.track(event, payload)
 *       Posts {event, ...payload} to looma-telemetry.php (best-effort, no-op on error).
 *
 *   LOOMA.telemetry.startChapterTimer(meta)
 *   LOOMA.telemetry.stopChapterTimer()
 *       Tracks how long a chapter PDF stays visible. Auto-flushes on
 *       beforeunload / visibilitychange so the duration always lands.
 *
 *   LOOMA.telemetry.score(activity, payload)
 *       Convenience wrapper for game/exercise/exam score events.
 *
 * Also installs a window 'message' listener so quizzes/exams rendered inside
 * iframes (served by looma-ai on a different port) can postMessage their score
 * up to the parent page, which forwards it through the same telemetry path.
 */
(function () {
    'use strict';

    var ENDPOINT = 'looma-telemetry.php';

    function postJson(url, body) {
        try {
            var data = JSON.stringify(body);
            // sendBeacon survives page unload, fetch is fine otherwise.
            if (navigator.sendBeacon) {
                var blob = new Blob([data], { type: 'application/json' });
                if (navigator.sendBeacon(url, blob)) return;
            }
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: data,
                keepalive: true,
                credentials: 'same-origin',
            }).catch(function () {});
        } catch (e) { /* swallow */ }
    }

    function track(event, payload) {
        if (!event) return;
        var body = Object.assign({ event: event }, payload || {});
        postJson(ENDPOINT, body);
    }

    var chapterTimer = null;

    function startChapterTimer(meta) {
        stopChapterTimer(); // flush any previous session first
        chapterTimer = {
            start: Date.now(),
            meta: Object.assign({}, meta || {}),
            flushed: false,
        };
    }

    function stopChapterTimer() {
        if (!chapterTimer || chapterTimer.flushed) {
            chapterTimer = null;
            return;
        }
        var dur = Date.now() - chapterTimer.start;
        chapterTimer.flushed = true;
        if (dur < 1000) return; // ignore noise (<1s)
        track('chapter_time', Object.assign({ duration_ms: dur }, chapterTimer.meta));
        chapterTimer = null;
    }

    function updateChapterMeta(patch) {
        if (!chapterTimer) return;
        chapterTimer.meta = Object.assign({}, chapterTimer.meta, patch || {});
    }

    function score(activity, payload) {
        var body = Object.assign({ activity: activity }, payload || {});
        if (typeof body.correct === 'number' && typeof body.total === 'number' && body.total > 0) {
            body.score = body.correct / body.total;
        }
        track('score', body);
    }

    window.addEventListener('beforeunload', stopChapterTimer);
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') stopChapterTimer();
    });

    // Iframe → parent bridge for AI-served quiz/exam pages on port 8089.
    window.addEventListener('message', function (e) {
        var d = e && e.data;
        if (!d || typeof d !== 'object' || d.source !== 'looma-telemetry') return;
        if (d.event) track(d.event, d.payload || {});
    });

    window.LOOMA = window.LOOMA || {};
    window.LOOMA.telemetry = {
        track: track,
        score: score,
        startChapterTimer: startChapterTimer,
        stopChapterTimer: stopChapterTimer,
        updateChapterMeta: updateChapterMeta,
    };
})();
