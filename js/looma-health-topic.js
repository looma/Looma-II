/*
 * filename: looma-health-topic.js
 * First Aid topic page: Emergency/Learn toggle, Learn stepping (Next/Back + arrow keys),
 * and the end-of-Learn quiz. No network use; all content is already in the DOM.
 */
'use strict';

$(document).ready(function () {
    toolbar_button_activate("health");

    /* ---------- bilingual helpers for JS-generated chrome (step/quiz counters) ----------
       These labels are built in JS, so they can't be authored as .english/.native spans in
       the markup. We emit both spans and let the current language decide visibility, so the
       toolbar flag (LOOMA.translate) toggles them like everything else on the page. */
    function faLang() { try { return LOOMA.readStore('language', 'cookie'); } catch (e) { return null; } }
    var DEV = '०१२३४५६७८९';
    function faDev(s) { return String(s).replace(/[0-9]/g, function (d) { return DEV[+d]; }); }   // ASCII -> Devanagari digits
    function faBi($el, en, np) {
        $el.html('<span class="english">' + en + '</span><span class="native">' + np + '</span>');
        var native = faLang() === 'native';
        $el.find('.english').toggle(!native);
        $el.find('.native').toggle(native);
    }

    /* ---------- Emergency / Learn toggle ---------- */
    var $tabs  = $('.fa-toggle button');
    var $views = { emergency: $('#fa-view-emergency'), learn: $('#fa-view-learn'), game: $('#fa-view-game') };

    function showView(name) {
        $tabs.attr('aria-selected', 'false');
        $tabs.filter('[data-view="' + name + '"]').attr('aria-selected', 'true');
        $.each($views, function (key, $v) { $v.toggleClass('fa-view-active', key === name); });
        if (name === 'game') {   // lazy-load + auto-size the branching game iframe (no inner scrollbar)
            var f = document.getElementById('fa-game-frame');
            if (f && !f.getAttribute('src')) {
                f.addEventListener('load', function () {
                    function fit() {
                        try {
                            var doc = f.contentWindow.document;
                            var card = doc.getElementById('branchinggame');
                            f.style.height = ((card ? card.offsetHeight : doc.body.scrollHeight) + 24) + 'px';
                        } catch (e) {}
                    }
                    fit();
                    // re-fit as the scenario grows/shrinks (feedback panels, endings)
                    try { new ResizeObserver(fit).observe(f.contentWindow.document.body); } catch (e) {}
                });
                f.setAttribute('src', f.getAttribute('data-src'));
            }
        }
    }
    $tabs.on('click', function () { showView($(this).data('view')); });
    // defaults to Emergency (markup already sets it active), unless a ?view= param deep-links
    // to a specific view — e.g. looma-health-topic.php?id=snakebite&view=learn
    var wantView = new URLSearchParams(window.location.search).get('view');
    if (wantView && $views[wantView]) showView(wantView);

    /* ---------- Emergency action cards: tap to reveal the picture ---------- */
    $('.fa-step-expand').on('click', function () {
        var $btn = $(this);
        var open = $btn.attr('aria-expanded') === 'true';
        $btn.attr('aria-expanded', open ? 'false' : 'true');
        $('#' + $btn.attr('aria-controls')).prop('hidden', open);
    });

    /* ---------- Learn stepping ---------- */
    var $cards = $('#fa-view-learn .fa-learn-card');
    var total  = $cards.length;
    var idx    = 0;
    var $back  = $('#fa-learn-back');
    var $next  = $('#fa-learn-next');
    var $lpCount = $('#fa-lp-count');
    var $lpTitle = $('#fa-lp-title');

    // segmented progress bar — one segment per card; the quiz card's title is "Quiz"
    var $track = $('#fa-lp-track');
    var titles = [];
    $cards.each(function (i) {
        if ($(this).hasClass('fa-quiz-card')) {
            titles.push({ en: 'Quiz', np: 'क्विज' });
        } else {
            var $act = $(this).find('.fa-learn-action').first();
            titles.push({
                en: $.trim($act.find('.english').first().text()),
                np: $.trim($act.find('.native').first().text())
            });
        }
        $track.append($('<span class="fa-lp-seg">').attr('data-i', i));
    });
    var $segs = $track.children('.fa-lp-seg');

    function renderLearn() {
        $cards.each(function (i) { this.hidden = (i !== idx); });
        $segs.each(function (i) { $(this).toggleClass('filled', i <= idx); });
        if (total > 0) {
            faBi($lpCount, 'Step ' + (idx + 1) + ' of ' + total,
                          'चरण ' + faDev(idx + 1) + '/' + faDev(total));
            var t = titles[idx] || { en: '', np: '' };
            faBi($lpTitle, t.en, t.np || t.en);
        }
        $back.prop('disabled', idx === 0);
        $next.prop('disabled', idx >= total - 1);
    }
    $next.on('click', function () { if (idx < total - 1) { idx++; renderLearn(); } });
    $back.on('click', function () { if (idx > 0)         { idx--; renderLearn(); } });

    // keyboard arrows advance Learn cards (PRD §10) — only while Learn view is showing
    $(document).on('keydown', function (e) {
        if (!$views.learn.hasClass('fa-view-active')) return;
        if (e.key === 'ArrowRight') { if (idx < total - 1) { idx++; renderLearn(); } }
        else if (e.key === 'ArrowLeft') { if (idx > 0)     { idx--; renderLearn(); } }
    });

    if (total > 0) renderLearn();

    /* ---------- Quiz (self-check, no scoring) ---------- */
    var $qBlocks = $('.fa-quiz-q-block');
    var qTotal   = $qBlocks.length;
    var $qProg   = $('#fa-quiz-progress');

    function renderQuizProgress(current) {
        if (qTotal > 0) faBi($qProg, 'Question ' + (current + 1) + ' of ' + qTotal,
                                     'प्रश्न ' + faDev(current + 1) + '/' + faDev(qTotal));
    }
    renderQuizProgress(0);

    $('.fa-quiz-option').on('click', function () {
        var $opt = $(this);
        var $block = $opt.closest('.fa-quiz-q-block');
        if ($block.data('answered')) return;           // one answer per question
        $block.data('answered', true);

        // mark this choice + always reveal the correct one (icon + colour, PRD §10)
        var isCorrect = $opt.attr('data-correct') === '1';
        $opt.addClass(isCorrect ? 'correct' : 'incorrect');
        $block.find('.fa-quiz-option').each(function () {
            if ($(this).attr('data-correct') === '1') $(this).addClass('correct');
            this.disabled = true;
        });
        $block.find('.fa-quiz-feedback').addClass('show');
        $block.find('.fa-quiz-next').removeAttr('hidden');
    });

    // "See the quick steps" on the done panel jumps back to the Emergency view
    $('.fa-done-review').on('click', function () { showView('emergency'); window.scrollTo(0, 0); });

    // Back to the previous quiz question (keeps its already-answered state)
    $('.fa-quiz-back').on('click', function () {
        var $block = $(this).closest('.fa-quiz-q-block');
        var qi = $block.data('quiz-index');
        var prev = $qBlocks.filter('[data-quiz-index="' + (qi - 1) + '"]');
        if (prev.length) {
            $block.attr('hidden', 'hidden');
            prev.removeAttr('hidden');
            renderQuizProgress(qi - 1);
        }
    });

    $('.fa-quiz-next').on('click', function () {
        var $block = $(this).closest('.fa-quiz-q-block');
        var qi = $block.data('quiz-index');
        var next = $qBlocks.filter('[data-quiz-index="' + (qi + 1) + '"]');
        $block.attr('hidden', 'hidden');
        if (next.length) {
            next.removeAttr('hidden');
            renderQuizProgress(qi + 1);
        } else {
            $('.fa-quiz-done').removeAttr('hidden');
            faBi($qProg, 'Done', 'सम्पन्न');
        }
    });
});
