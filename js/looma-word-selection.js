/*
 * Name: Skip
 * Owner: VillageTech Solutions (villagetechsolutions.org)
 * File: looma-word-selection.js
 * Description: Word selection handler for inline dictionary lookups with TTS
 *
 * Functionality:
 * - Detects a 1-3 word selection (a longer selection shows NO card).
 * - On hover over the selection, shows a definition card with:
 *     - the selected word, trimmed and centred at the top of the card
 *     - the definition from Looma's built-in dictionary
 *     - if the word is NOT in Looma's dictionary, an online definition
 *       fetched in the background (English words only)
 *     - an English TTS button and a Nepali TTS button
 * - The card is positioned above or below the selection depending on space.
 *
 * IMPORTANT — text-to-speech policy:
 *   Selecting or hovering text NEVER speaks anything. TTS is produced ONLY
 *   when the user clicks the English or Nepali button inside the card. The
 *   buttons call LOOMA.speak(), which uses whichever engine/voice the user
 *   picked on the Reading Settings page. There is deliberately no automatic
 *   speech anywhere in this file.
 */

'use strict';

var LOOMA_WORD_SELECTION = (function () {

    var selectedText = '';
    var selectedRange = null;
    var currentCard = null;
    var currentCardText = '';
    var loadingText = '';      // word whose dictionary lookup is currently in flight

    // Configuration
    var config = {
        maxWords: 3,
        dictionaryAPI: 'looma-dictionary-utilities.php',
        cardZIndex: 10000,
        hoverDelay: 300
    };

    var hoverTimeout = null;

    /**
     * Clean a raw selection string. PDF.js splits text into many spans, so a
     * selection often arrives padded with whitespace at the ends and with "|"
     * separators or stray line breaks inside. Collapse all of that to a single
     * trimmed string so the card shows a tidy word.
     */
    function cleanText(text) {
        // LOOMA.cleanSelectedText() also drops digits wedged into a word ("so1me"),
        // which a PDF text layer produces often enough that the card would otherwise
        // show a nonsense word and look up a word that cannot exist.
        if (typeof LOOMA !== 'undefined' && typeof LOOMA.cleanSelectedText === 'function') {
            return LOOMA.cleanSelectedText(text);
        }
        return String(text == null ? '' : text)
            .replace(/\|/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Count words in an (already cleaned or raw) string.
     */
    function countWords(text) {
        var t = cleanText(text);
        return t ? t.split(' ').length : 0;
    }

    /**
     * Validate selected text: a card is shown only for 1-3 words.
     * A selection of 4+ words returns false, so no card appears.
     */
    function isValidSelection(text) {
        var n = countWords(text);
        return n >= 1 && n <= config.maxWords;
    }

    /**
     * Detect the language of a string: Nepali if it contains Devanagari
     * (Unicode block U+0900-U+097F).
     */
    function getSelectedLanguage(text) {
        return /[ऀ-ॿ]/.test(text || '') ? 'np' : 'en';
    }

    /**
     * Look the word up in the Looma (Mongo) dictionary only — fast and local.
     * The online fallback is a separate, background step (see showCard()).
     */
    function fetchDefinition(word, callback) {
        $.ajax({
            url: config.dictionaryAPI,
            type: 'GET',
            data: {
                cmd: 'lookup',
                word: word
            },
            dataType: 'json',
            timeout: 5000,
            success: function (data) {
                callback(null, data || {});
            },
            error: function (xhr, status, err) {
                callback(err || 'Lookup failed', null);
            }
        });
    }

    /**
     * Get dictionary text by language. The Looma dictionary stores English in
     * `en` and Nepali in `np`; fall back to the selection only for that same
     * language.
     */
    function getTextForLanguage(wordData, selection, lang) {
        var selectedLang = getSelectedLanguage(selection);
        if (lang === 'en') return wordData.en || (selectedLang === 'en' ? selection : '');
        return wordData.np || (selectedLang === 'np' ? selection : '');
    }

    /**
     * Build a readable definition string from a Looma dictionary record.
     * Mirrors looma-utilities.js > defHTML(): prefer the plain `def` string,
     * otherwise format the `meanings` array of { part, def } objects.
     * Returns '' when there is no usable definition — that empty result is
     * the signal for the caller to fall back to an online lookup.
     */
    function getDictionaryDefinition(wordData) {
        if (!wordData) return '';

        // Plain `def` string — but "Word not found" is the server's
        // not-found marker, not a real definition.
        if (typeof wordData.def === 'string') {
            var def = wordData.def.trim();
            if (def && def.toLowerCase() !== 'word not found') return def;
        }

        // `meanings` is normally an array of { part, def } objects.
        var meanings = wordData.meanings;
        if (Array.isArray(meanings)) {
            var parts = [];
            meanings.forEach(function (m) {
                if (!m) return;
                if (typeof m === 'string') {
                    if (m.trim()) parts.push(m.trim());
                    return;
                }
                var d = String(m.def || m.definition || '').trim();
                if (!d) return;
                var p = String(m.part || m.partOfSpeech || '').trim();
                parts.push(p ? '(' + p + ') ' + d : d);
            });
            if (parts.length) return parts.join('; ');
        } else if (typeof meanings === 'string' && meanings.trim()) {
            return meanings.trim();
        }

        return '';
    }

    /**
     * Create the definition card. `displayWord` is the cleaned/trimmed
     * selection and is shown, centred, at the top of the card.
     */
    function createCard(wordData, displayWord) {
        wordData = wordData || {};
        var selectedLang = getSelectedLanguage(displayWord);
        var englishText = getTextForLanguage(wordData, displayWord, 'en');
        var nepaliText = getTextForLanguage(wordData, displayWord, 'np');
        var translation = selectedLang === 'np' ? englishText : nepaliText;

        var englishButtonClass = englishText ? '' : ' disabled';
        var englishButtonDisabled = englishText ? '' : ' disabled aria-disabled="true"';
        var nepaliButtonClass = nepaliText ? '' : ' disabled';
        var nepaliButtonDisabled = nepaliText ? '' : ' disabled aria-disabled="true"';

        var html = '<div class="looma-word-card">' +
            '<div class="word-card-header">' +
                '<span class="word-text">' + LOOMA.escapeHTML(displayWord) + '</span>' +
                '<button class="word-card-close" type="button" title="Close">&times;</button>' +
            '</div>' +
            '<div class="word-card-content">' +
                '<div class="word-definition">' +
                    '<strong>Definition:</strong> ' +
                    '<span class="word-definition-text"></span>' +
                '</div>';

        if (translation) {
            var langLabel = selectedLang === 'np' ? 'English' : 'Nepali';
            html += '<div class="word-translation">' +
                '<strong>' + langLabel + ':</strong> ' + LOOMA.escapeHTML(translation) +
            '</div>';
        }

        html += '<div class="word-card-actions">' +
            '<button class="word-tts-button word-tts-english' + englishButtonClass + '" type="button" title="Pronounce English"' + englishButtonDisabled + '>' +
                '<img src="images/audio.png" alt="Speak" />' +
                '<span>English</span>' +
            '</button>' +
            '<button class="word-tts-button word-tts-nepali' + nepaliButtonClass + '" type="button" title="Pronounce Nepali"' + nepaliButtonDisabled + '>' +
                '<img src="images/audio.png" alt="Speak" />' +
                '<span>Nepali</span>' +
            '</button>' +
        '</div>' +
        '</div>' +
        '</div>';

        var $card = $(html);
        $card.data('ttsEnglish', englishText || '');
        $card.data('ttsNepali', nepaliText || '');
        return $card;
    }

    /**
     * Set the definition text shown in a card.
     *   state: 'ok'      — a real definition (from Looma's dictionary)
     *          'online'  — a definition fetched from the internet
     *          'pending' — a "looking it up" placeholder
     *          'none'    — no definition available
     */
    function setCardDefinition($card, text, state) {
        if (!$card) return;
        var $text = $card.find('.word-definition-text');
        $text.text(text || '');
        $text.removeClass('word-definition-pending word-definition-online word-definition-none');
        if (state === 'pending') $text.addClass('word-definition-pending');
        else if (state === 'online') $text.addClass('word-definition-online');
        else if (state === 'none') $text.addClass('word-definition-none');

        // The card may have grown/shrunk — keep it anchored to its selection.
        var rect = $card.data('selectionRect');
        if (rect) positionCard($card, rect);
    }

    function firstVisibleRect(range) {
        if (!range) return null;
        var rects = range.getClientRects ? range.getClientRects() : [];
        for (var i = 0; i < rects.length; i++) {
            if (rects[i].width > 0 && rects[i].height > 0) return rects[i];
        }

        var rect = range.getBoundingClientRect ? range.getBoundingClientRect() : null;
        if (rect && rect.width > 0 && rect.height > 0) return rect;
        return null;
    }

    /**
     * Position the card beside the selected text, using the selection rect.
     */
    function positionCard($card, selectionRect) {
        var cardHeight = $card.outerHeight() || 200;
        var cardWidth = $card.outerWidth() || 280;
        var gap = 10;

        var viewportHeight = window.innerHeight;
        var viewportWidth = window.innerWidth;
        var spaceBelow = viewportHeight - selectionRect.bottom;

        var top, left;

        // Position above or below depending on available space.
        if (spaceBelow < cardHeight + gap && selectionRect.top > cardHeight + gap) {
            top = selectionRect.top - cardHeight - gap;
        } else {
            top = selectionRect.bottom + gap;
        }

        // Centre horizontally on the selection so the card clearly belongs to it.
        left = selectionRect.left + (selectionRect.width / 2) - (cardWidth / 2);

        // Clamp to the viewport.
        left = Math.max(gap, Math.min(left, viewportWidth - cardWidth - gap));
        top = Math.max(gap, Math.min(top, viewportHeight - cardHeight - gap));

        $card.css({
            position: 'fixed',
            top: top + 'px',
            left: left + 'px',
            zIndex: config.cardZIndex
        });
    }

    /**
     * Speak text using TTS. Called ONLY from the card's English/Nepali button
     * click handlers — never automatically. LOOMA.speak() uses the engine and
     * voice chosen on the Reading Settings page.
     */
    function speakSelectedText(text) {
        if (text && typeof LOOMA !== 'undefined' && typeof LOOMA.speak === 'function') {
            LOOMA.speak(text);
        }
    }

    /**
     * Wire up the close button, the two TTS buttons, and Escape-to-close.
     * The TTS buttons are the ONLY thing in this file that produces speech.
     */
    function bindCardHandlers($card) {
        $card.on('click', '.word-card-close', function (e) {
            e.preventDefault();
            e.stopPropagation();
            hideCard();
        });

        $card.on('click', '.word-tts-english', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if ($(this).is('.disabled, :disabled')) return;
            speakSelectedText($card.data('ttsEnglish'));
        });

        $card.on('click', '.word-tts-nepali', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if ($(this).is('.disabled, :disabled')) return;
            speakSelectedText($card.data('ttsNepali'));
        });

        $(document).on('keydown.wordcard', function (e) {
            if (e.key === 'Escape') hideCard();
        });
    }

    /**
     * Fill in the card's definition: show the Looma dictionary definition if
     * there is one, otherwise fetch one online in the background.
     */
    function populateDefinition($card, wordData, displayWord) {
        var localDef = getDictionaryDefinition(wordData);
        if (localDef) {
            setCardDefinition($card, localDef, 'ok');
            return;
        }

        // No definition in Looma's own dictionary. Try the internet — but only
        // for English words (no reliable free Nepali dictionary API exists).
        var lang = getSelectedLanguage(displayWord);
        var online = (typeof LOOMA !== 'undefined' && typeof LOOMA.onlineLookup === 'function');
        var canBeOnline = (typeof navigator === 'undefined') || navigator.onLine !== false;

        if (lang !== 'en' || !online || !canBeOnline) {
            setCardDefinition($card, 'Not found in Looma dictionary.', 'none');
            return;
        }

        // Background online lookup — this never blocks and never speaks.
        setCardDefinition($card, 'Looking up online…', 'pending');
        LOOMA.onlineLookup(displayWord, function (result) {
            if (currentCard !== $card) return;   // card was closed/replaced
            setCardDefinition($card, result.def, 'online');
        }, function () {
            if (currentCard !== $card) return;
            setCardDefinition($card, 'No definition found.', 'none');
        });
    }

    /**
     * Show the definition card for the current selection.
     */
    function showCard(selectionRect, rawText) {
        var displayWord = cleanText(rawText);
        if (!displayWord) return;

        // Already showing the card for this exact word, or already fetching
        // it — don't rebuild it (avoids flicker and a needless re-fetch while
        // the mouse lingers on the selection).
        if (currentCard && currentCardText === displayWord) return;
        if (loadingText === displayWord) return;

        loadingText = displayWord;

        fetchDefinition(displayWord, function (err, wordData) {
            // A newer selection (or a cleared selection) superseded this
            // fetch while it was in flight — drop the stale result.
            if (loadingText !== displayWord) return;
            loadingText = '';

            // Even if the local lookup failed, still show the card so the user
            // gets feedback; populateDefinition() then tries the online path.
            wordData = wordData || { en: displayWord, np: '' };

            // Replace any previous card only now that the new one is ready.
            hideCard();

            var $card = createCard(wordData, displayWord);
            $('body').append($card);
            $card.data('selectionRect', selectionRect);

            positionCard($card, selectionRect);
            currentCard = $card;
            currentCardText = displayWord;

            bindCardHandlers($card);
            populateDefinition($card, wordData, displayWord);
        });
    }

    /**
     * Hide the definition card. Also abandons any dictionary lookup that is
     * still in flight, so a card for a stale selection can never pop up later.
     */
    function hideCard() {
        if (currentCard) {
            currentCard.remove();
            currentCard = null;
        }
        currentCardText = '';
        loadingText = '';
        $(document).off('keydown.wordcard');
    }

    /**
     * Handle text selection (on mouseup). Stores the selection only when it is
     * 1-3 words; a longer selection clears the state so no card can appear.
     */
    function handleTextSelection() {
        clearTimeout(hoverTimeout);

        var selection = window.getSelection();
        if (!selection || selection.toString().length === 0) {
            selectedText = '';
            selectedRange = null;
            return;
        }

        var raw = selection.toString();

        // 1-3 words only. A longer selection shows no card.
        if (!isValidSelection(raw)) {
            selectedText = '';
            selectedRange = null;
            hideCard();
            return;
        }

        selectedText = cleanText(raw);

        if (selection.rangeCount > 0) {
            selectedRange = selection.getRangeAt(0);
        }
    }

    /**
     * Handle mouse hover over the selected text — this only ever SHOWS the
     * card. It does not, and must not, trigger any speech.
     */
    function handleTextHover(e) {
        if (!selectedText || !selectedRange) return;

        var rect = firstVisibleRect(selectedRange);
        if (!rect) return;

        var mouseX = e.clientX;
        var mouseY = e.clientY;

        if (mouseX >= rect.left && mouseX <= rect.right &&
            mouseY >= rect.top && mouseY <= rect.bottom) {

            clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(function () {
                var freshRect = firstVisibleRect(selectedRange);
                if (freshRect) showCard(freshRect, selectedText);
            }, config.hoverDelay);
        }
    }

    /**
     * Initialize the word selection handler.
     */
    function init() {
        // Track text selection.
        $(document).on('mouseup', function () {
            handleTextSelection();
        });

        // Show the card on hover over the selection.
        $(document).on('mousemove', function (e) {
            handleTextHover(e);
        });

        // Close the card when clicking outside it.
        $(document).on('click', function (e) {
            if (!$(e.target).closest('.looma-word-card').length) {
                hideCard();
            }
        });
    }

    return {
        init: init
    };
})();

// Initialize when document is ready
$(document).ready(function () {
    LOOMA_WORD_SELECTION.init();
});
