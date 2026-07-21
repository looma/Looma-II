/*
LOOMA javascript file
Filename: looma-test-speech.js
Description: drives looma-test-speech.php — the "Reading Settings" page.
             The two TTS engines are Piper (local/offline) and ResponsiveVoice
             (cloud — needs internet). Mimic and the browser speechSynthesis
             engine were removed. The page lets you pick a separate English and
             Nepali voice for each engine, set the reading speed per language,
             and choose which engine is the default for reading text selections.

             Every setting is saved to cookies and read back automatically:
               tts-engine    — default TTS engine ('piper' or 'responsivevoice')
               tts-voice-en  — default engine's English voice
               tts-voice-np  — default engine's Nepali voice
               tts-rate-en   — English reading speed
               tts-rate-np   — Nepali reading speed
             LOOMA.speak() reads these cookies, so English text is spoken with
             the English voice and Nepali text with the Nepali voice.
Programmer name: Skip
Revision: Looma 2.0.x  (Mimic / browser speechSynthesis removed)
 */

'use strict';

$(document).ready(function () {

    var ENGINES = ['piper', 'responsivevoice'];
    var FALLBACK_ENGINE = 'piper';
    var DEFAULT_RATE = '0.67';   // 2/3 — Looma's default reading speed for Nepal

    // Per-engine selected voices — English and Nepali kept separately so each
    // language is read with the right voice.
    var voices = {
        piper:           { en: 'en_US-amy-low.onnx', np: 'ne_NP-google-x_low.onnx' },
        responsivevoice: { en: 'UK English Female',  np: 'Hindi Female' }
    };

    // The <select> id for each engine/language.
    var selectIds = {
        piper:           { en: 'piper-voice-en',           np: 'piper-voice-np' },
        responsivevoice: { en: 'responsivevoice-voice-en', np: 'responsivevoice-voice-np' }
    };

    // Per-engine, per-language speech speed.
    var rates = {
        piper:           { en: DEFAULT_RATE, np: DEFAULT_RATE },
        responsivevoice: { en: DEFAULT_RATE, np: DEFAULT_RATE }
    };

    var rateSelectIds = {
        piper:           { en: 'piper-rate-en',           np: 'piper-rate-np' },
        responsivevoice: { en: 'responsivevoice-rate-en', np: 'responsivevoice-rate-np' }
    };

    function phrase() { return $('input#text').val(); }

    // The speed map { en, np } LOOMA.speak() expects for a given engine.
    function rateObj(engine) {
        return { en: rates[engine].en, np: (rates[engine].np || rates[engine].en) };
    }

    // true if SELECT #id contains an <option> with this exact value
    function hasOption(id, value) {
        return $('#' + id + ' option').filter(function () {
            return this.value === value;
        }).length > 0;
    }

    /* ---- engine Speak buttons — both route through LOOMA.speak() so the page
            exercises the exact same path (and telemetry) as the rest of Looma.
            The voice is passed as { en, np }; LOOMA.speak picks the right one
            per sentence from the detected language. ---- */

    /* ---- "waiting for the engine" spinner ----
       LOOMA.speak's own pending/busy visuals only reach the floating `button.speak`
       control, which this page does not have — so pressing an engine button used to
       do nothing visible until audio came out. That gap is seconds long for
       ResponsiveVoice, which has to fetch its script from responsivevoice.org and
       then wait on the cloud, and a teacher with no feedback just presses again.
       The spinner runs from the click until the first audio (or the failure). */
    var $pendingButton = null;
    var sawPending = false;
    var spinnerTimeout = null;

    function clearSpinner() {
        if ($pendingButton) $pendingButton.removeClass('tts-engine-pending');
        $pendingButton = null;
        sawPending = false;
        if (spinnerTimeout) { clearTimeout(spinnerTimeout); spinnerTimeout = null; }
    }

    function showSpinnerOn($button) {
        clearSpinner();
        $pendingButton = $button;
        $pendingButton.addClass('tts-engine-pending');
        // A run that never reaches the pending state at all (empty phrase, an engine
        // that bails out early) would otherwise leave the spinner turning for good.
        spinnerTimeout = setTimeout(clearSpinner, 15000);
    }

    if (LOOMA.speak.onStateChange) {
        LOOMA.speak.onStateChange(function (state) {
            if (!$pendingButton) return;
            // LOOMA.speak resets the button state on its way in, so a `pending: false`
            // arriving before the request is even sent is not the wait being over.
            // Only stop the spinner once the wait has actually been entered — or once
            // audio is sounding, which ends it whatever the order of events.
            if (state.pending) { sawPending = true; return; }
            if (sawPending || state.busy) clearSpinner();
        });
    }

    $('#piper').click(function () {
        showSpinnerOn($(this));
        LOOMA.speak(phrase(), 'piper', { en: voices.piper.en, np: voices.piper.np }, rateObj('piper'));
    });
    $('#responsivevoice').click(function () {
        showSpinnerOn($(this));
        LOOMA.speak(phrase(), 'responsivevoice', { en: voices.responsivevoice.en, np: voices.responsivevoice.np }, rateObj('responsivevoice'));
    });

    /* Report a Reading-Settings change to looma-telemetry.php (best effort). */
    function trackConfigChange(field, engine, lang) {
        try {
            if (!window.LOOMA || !LOOMA.telemetry || !LOOMA.telemetry.track) return;
            var def = currentDefaultEngine();
            LOOMA.telemetry.track('tts_config', {
                tts_status:   'changed',
                tts_engine:   engine || def,
                tts_voice:    (engine && lang) ? (voices[engine] && voices[engine][lang]) || '' : '',
                tts_language: lang || '',
                tts_rate:     parseFloat(
                                  (engine && lang && rates[engine] && rates[engine][lang]) ||
                                  (rates[def] && rates[def].en)
                              ) || null,
                tts_source:   'reading-settings:' + field
            });
        } catch (e) { /* swallow */ }
    }

    /* ---- voice pickers ---- */
    function bindVoice(engine, lang, selectId) {
        $('#' + selectId).change(function () {
            voices[engine][lang] = this.value;
            syncDefaultVoice(engine);
            trackConfigChange('voice', engine, lang);
        });
    }
    ENGINES.forEach(function (engine) {
        ['en', 'np'].forEach(function (lang) { bindVoice(engine, lang, selectIds[engine][lang]); });
    });

    /* ---- speech speed (per engine, per language) ---- */
    function bindRate(engine, lang, selectId) {
        $('#' + selectId).change(function () {
            rates[engine][lang] = this.value;
            LOOMA.setStore('tts-rate-' + engine + '-' + lang, this.value, 'cookie');
            syncDefaultRate(engine);
            trackConfigChange('rate', engine, lang);
        });
    }
    ENGINES.forEach(function (engine) {
        ['en', 'np'].forEach(function (lang) { bindRate(engine, lang, rateSelectIds[engine][lang]); });
    });

    /* ---- default TTS engine for reading text selections ----
       The Speak control button reads selections via LOOMA.speak() without
       naming an engine; LOOMA.speak() falls back to the tts-engine /
       tts-voice-en / tts-voice-np cookies written here. The checkboxes act as a
       radio group — exactly one engine is the default at any time. */
    function saveDefaultEngine(engine) {
        LOOMA.setStore('tts-engine',   engine,                  'cookie');
        LOOMA.setStore('tts-voice-en', voices[engine].en || '', 'cookie');
        LOOMA.setStore('tts-voice-np', voices[engine].np || '', 'cookie');
        LOOMA.setStore('tts-rate-en',  rates[engine].en || DEFAULT_RATE, 'cookie');
        LOOMA.setStore('tts-rate-np',  rates[engine].np || rates[engine].en || DEFAULT_RATE, 'cookie');
    }
    function showDefaultEngine(engine) {
        $('.tts-default').each(function () {
            this.checked = ($(this).data('engine') === engine);
        });
    }
    function currentDefaultEngine() {
        return $('.tts-default:checked').data('engine') || FALLBACK_ENGINE;
    }
    function syncDefaultVoice(engine) {
        if (currentDefaultEngine() === engine) saveDefaultEngine(engine);
    }
    function syncDefaultRate(engine) {
        if (currentDefaultEngine() === engine) saveDefaultEngine(engine);
    }

    $('.tts-default').change(function () {
        var engine = $(this).data('engine');
        if (this.checked) {
            showDefaultEngine(engine);     // radio-style: only one default
            saveDefaultEngine(engine);
            trackConfigChange('engine', engine);
        } else {
            this.checked = true;           // there must always be one default
        }
    });

    /* ---- ResponsiveVoice availability gate ----
       ResponsiveVoice is a CLOUD engine: it cannot work without internet. So it
       can only be picked here when the box is actually able to reach it. Piper
       is the default and is always available (local/offline).

       navigator.onLine alone is not enough — it reports true for a box on a LAN
       with no route to the internet, which is a common Looma deployment. So an
       offline flag is treated as definitive (no probe), while an online flag is
       only a hint that is then CONFIRMED by actually loading the RV script via
       LOOMA.speak.ensureResponsiveVoice() (cached, so this costs one request per
       session at most). Until that confirms, RV stays locked. */
    // The whole ResponsiveVoice column is locked together — the Speak button,
    // both voice pickers, both speed pickers and the default checkbox. Leaving
    // some of them live inside a dimmed column would just look broken.
    var $rvControls = $('#responsivevoice, #responsivevoice-default, ' +
                        '#' + selectIds.responsivevoice.en + ', #' + selectIds.responsivevoice.np + ', ' +
                        '#' + rateSelectIds.responsivevoice.en + ', #' + rateSelectIds.responsivevoice.np);

    function setResponsiveVoiceAvailable(available, reason) {
        $rvControls.prop('disabled', !available);
        $('#responsivevoice-default').closest('.tts-engine')
            .toggleClass('tts-engine-unavailable', !available);
        $('#responsivevoice-unavailable-note').text(available ? '' : reason || '');
    }

    function refreshResponsiveVoiceAvailability() {
        if (!navigator.onLine) {
            setResponsiveVoiceAvailable(false, 'Needs internet — not connected.');
            return;
        }
        setResponsiveVoiceAvailable(false, 'Checking internet connection…');
        try {
            LOOMA.speak.ensureResponsiveVoice(function (ok) {
                setResponsiveVoiceAvailable(ok, ok ? '' : 'Cannot reach ResponsiveVoice — no internet.');
            });
        } catch (e) {
            setResponsiveVoiceAvailable(false, 'Cannot reach ResponsiveVoice — no internet.');
        }
    }

    // Re-check when the box gains or loses its connection, so the teacher does
    // not have to reload the page after plugging in the network.
    $(window).on('online offline', refreshResponsiveVoiceAvailability);

    /* ---- restore the saved settings when the page opens ---- */
    function restoreSavedSettings() {
        var legacyRate = LOOMA.readStore('tts-rate', 'cookie');

        var savedEngine = LOOMA.readStore('tts-engine', 'cookie') || FALLBACK_ENGINE;
        if (!voices[savedEngine]) savedEngine = FALLBACK_ENGINE;   // coerce removed engines to Piper

        var savedEn = LOOMA.readStore('tts-voice-en', 'cookie');
        var savedNp = LOOMA.readStore('tts-voice-np', 'cookie');
        if (savedEn) voices[savedEngine].en = savedEn;
        if (savedNp) voices[savedEngine].np = savedNp;

        ENGINES.forEach(function (engine) {
            ['en', 'np'].forEach(function (lang) {
                var id = selectIds[engine][lang];
                if (!id) return;
                var want = voices[engine][lang];
                if (want && hasOption(id, want)) $('#' + id).val(want);
                else voices[engine][lang] = $('#' + id).val() || '';
            });
        });

        ENGINES.forEach(function (engine) {
            ['en', 'np'].forEach(function (lang) {
                var id = rateSelectIds[engine][lang];
                if (!id) return;
                var saved = LOOMA.readStore('tts-rate-' + engine + '-' + lang, 'cookie') || legacyRate;
                if (saved && hasOption(id, saved)) { rates[engine][lang] = saved; $('#' + id).val(saved); }
                else rates[engine][lang] = $('#' + id).val() || DEFAULT_RATE;
            });
        });

        showDefaultEngine(savedEngine);
        // Make sure the cookies reflect a supported engine even before any change.
        saveDefaultEngine(savedEngine);
    }

    restoreSavedSettings();
    refreshResponsiveVoiceAvailability();

}); //end document.ready function
