/*
Filename: looma-clock-stopwatch.js
Description: Stopwatch + countdown Timer for the Looma clock page
             (looma-clock-stopwatch.php).
             - Toggle between "stopwatch" and "timer" modes.
             - Stopwatch counts up (MM:SS.cs); Start/Pause and Reset.
             - Timer counts down (MM:SS). Duration is set with preset
               minute buttons (1/5/10/30) plus -/+ to fine-tune.
             - At zero the display flashes red (no sound).
Owner: Looma Education
*/
'use strict';

$(document).ready(function () {

    toolbar_button_activate("clock");

    var TICK_MS = 50;        // how often the display refreshes
    var MAX_MIN = 180;       // cap the timer at 3 hours

    // Nepali for the dynamic Start/Pause button (Reset is translated in the PHP via keyword()).
    var NP = { Start: 'सुरु', Pause: 'रोक्नु' };

    var mode    = 'stopwatch';   // 'stopwatch' | 'timer'
    var running = false;
    var ticker  = null;          // setInterval id (null when stopped)

    // stopwatch state
    var swStart       = 0;       // Date.now() reference while running
    var swAccumulated = 0;       // elapsed ms banked while paused

    // timer state
    var setMinutes     = 5;                  // configured duration (whole minutes)
    var timerEnd       = 0;                  // Date.now() at which it hits zero (while running)
    var timerRemaining = setMinutes * 60000; // ms left (while paused/idle)

    // cached elements
    var $display    = $('#sw-display');
    var $startStop  = $('#sw-startStop');
    var $reset      = $('#sw-reset');
    var $timerSetup = $('#sw-timer-setup');
    var $presets    = $('.sw-preset-button');

    // ---------- display helpers ----------
    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function format(ms, withCenti) {
        if (ms < 0) ms = 0;
        var totalSec = Math.floor(ms / 1000);
        var mm = Math.floor(totalSec / 60);
        var ss = totalSec % 60;
        var out = pad(mm) + ':' + pad(ss);
        if (withCenti) out += '.' + pad(Math.floor((ms % 1000) / 10));
        return out;
    }

    function render() {
        if (mode === 'stopwatch') {
            var elapsed = running ? (Date.now() - swStart) : swAccumulated;
            $display.text(format(elapsed, true));
        } else {
            var remaining = running ? (timerEnd - Date.now()) : timerRemaining;
            if (running && remaining <= 0) { remaining = 0; timerFinished(); }
            $display.text(format(remaining, false));
        }
    }

    function startTicker() { if (!ticker) ticker = setInterval(render, TICK_MS); }
    function stopTicker()  { if (ticker) { clearInterval(ticker); ticker = null; } }

    // ---------- start / pause / reset ----------
    function startStop() {
        if (mode === 'stopwatch') {
            if (running) {                              // pause
                swAccumulated = Date.now() - swStart;
                running = false;
            } else {                                    // start / resume
                swStart = Date.now() - swAccumulated;
                running = true;
            }
        } else {                                        // timer
            if (running) {                              // pause
                timerRemaining = timerEnd - Date.now();
                running = false;
            } else {                                    // start / resume
                if (timerRemaining <= 0) return;        // nothing to count down
                clearFlash();
                timerEnd = Date.now() + timerRemaining;
                running = true;
            }
        }
        updateStartStopLabel();
        if (running) startTicker(); else stopTicker();
        render();
    }

    function resetAll() {
        running = false;
        stopTicker();
        clearFlash();
        if (mode === 'stopwatch') swAccumulated = 0;
        else                      timerRemaining = setMinutes * 60000;
        updateStartStopLabel();
        render();
    }

    function timerFinished() {
        running = false;
        stopTicker();
        timerRemaining = 0;
        updateStartStopLabel();
        flash();
    }

    // ---------- silent flash at zero ----------
    function flash()      { $display.addClass('flashing'); }
    function clearFlash() { $display.removeClass('flashing'); }

    function updateStartStopLabel() {
        var word = running ? 'Pause' : 'Start';
        // translatableSpans shows the right language now AND flips live when the
        // teacher presses the toolbar translate button.
        $startStop.html(LOOMA.translatableSpans(word, NP[word]));
    }

    // ---------- mode switching ----------
    function setMode(newMode) {
        if (newMode === mode) return;
        mode = newMode;
        running = false;
        stopTicker();
        clearFlash();
        $('#sw-mode-stopwatch').toggleClass('active', mode === 'stopwatch');
        $('#sw-mode-timer').toggleClass('active', mode === 'timer');
        $timerSetup.toggle(mode === 'timer');
        if (mode === 'stopwatch') {
            swAccumulated = 0;
        } else {
            timerRemaining = setMinutes * 60000;
            highlightPreset();
        }
        updateStartStopLabel();
        render();
    }

    // ---------- timer duration setup ----------
    function setMinutesTo(m) {
        setMinutes = Math.max(0, Math.min(MAX_MIN, m));
        timerRemaining = setMinutes * 60000;
        highlightPreset();
        render();
    }

    function highlightPreset() {
        $presets.each(function () {
            $(this).toggleClass('active', parseInt($(this).attr('data-min'), 10) === setMinutes);
        });
    }

    // ---------- events ----------
    $('#sw-mode-stopwatch').on('click', function () { setMode('stopwatch'); });
    $('#sw-mode-timer').on('click',     function () { setMode('timer'); });

    $startStop.on('click', startStop);
    $reset.on('click',     resetAll);

    $presets.on('click', function () {
        if (running) return;                            // don't change time mid-run
        setMinutesTo(parseInt($(this).attr('data-min'), 10));
    });
    $('#sw-plus').on('click',  function () { if (!running) setMinutesTo(setMinutes + 1); });
    $('#sw-minus').on('click', function () { if (!running) setMinutesTo(setMinutes - 1); });

    // ---------- initial state (stopwatch mode) ----------
    $timerSetup.hide();
    highlightPreset();
    updateStartStopLabel();
    render();
});
