/*
 * looma-play-exercise.js — chapter exercise player.
 *
 * Reads its context from #exercise-host data-* attrs (chapter / grade /
 * subject / language / n), pulls the quiz JSON from looma-ai's /quiz_data,
 * renders one MCQ at a time and only reveals the score on the last submit.
 * Posts a "score" telemetry event so the learning dashboards pick the run up.
 */
(function () {
    'use strict';

    var host = document.getElementById('exercise-host');
    if (!host) return;

    var CTX = {
        chapterId: host.getAttribute('data-chapter-id') || '',
        grade:     host.getAttribute('data-grade')      || '',
        subject:   host.getAttribute('data-subject')    || '',
        language:  host.getAttribute('data-language')   || '',
        n:         host.getAttribute('data-n')          || '',
    };

    var AI_BASE = (window.LOOMAAI_BASE) ||
                  (window.location.protocol + '//' + window.location.hostname + ':8089');

    var $ = function (s) { return document.querySelector(s); };

    var state = { questions: [], answers: [], idx: 0 };

    function escapeHtml(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
        });
    }

    function shuffle(a) {
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function ensureFour(q) {
        var opts = (q.options || []).slice();
        if (!opts.length) return [];
        if (opts.indexOf(q.answer) === -1) opts.unshift(q.answer);
        if (opts.length > 4) {
            var others = opts.filter(function (o) { return o !== q.answer; }).slice(0, 3);
            opts = others.concat([q.answer]);
        }
        while (opts.length < 4) opts.push('—');
        return shuffle(opts);
    }

    function load() {
        var url = AI_BASE + '/quiz_data?chapter_id=' + encodeURIComponent(CTX.chapterId);
        if (CTX.grade)    url += '&grade='    + encodeURIComponent(CTX.grade);
        if (CTX.subject)  url += '&subject='  + encodeURIComponent(CTX.subject);
        if (CTX.language) url += '&language=' + encodeURIComponent(CTX.language);
        if (CTX.n)        url += '&n='        + encodeURIComponent(CTX.n);

        fetch(url).then(function (r) { return r.json(); }).then(function (j) {
            $('#ex-loading').style.display = 'none';
            if (!j || j.ok === false || !j.questions || !j.questions.length) {
                $('#ex-empty-card').style.display = '';
                return;
            }
            state.questions = j.questions.map(function (q) {
                return {
                    prompt: q.prompt,
                    answer: q.answer,
                    options: ensureFour(q),
                    type: q.type,
                    source_activity: q.source_activity || '',
                    source_title:    q.source_title || '',
                };
            });
            state.answers = state.questions.map(function () { return null; });
            $('#ex-question-card').style.display = '';
            renderQuestion();
        }).catch(function (e) {
            var el = $('#ex-loading');
            if (el) el.innerHTML = '<p style="color:#b00020">Could not load exercise: ' +
                                   escapeHtml(e && e.message) + '</p>';
        });
    }

    function renderQuestion() {
        var q = state.questions[state.idx];
        if (!q) return;
        $('#ex-progress').textContent = 'Question ' + (state.idx + 1) + ' / ' + state.questions.length;
        $('#ex-q-prompt').textContent = q.prompt;
        var src = $('#ex-source-tag');
        if (q.source_activity) {
            src.textContent = 'From ' + q.source_activity + (q.source_title ? (' — ' + q.source_title) : '');
            src.style.display = '';
        } else {
            src.style.display = 'none';
        }
        var box = $('#ex-q-options');
        box.innerHTML = '';
        q.options.forEach(function (opt, i) {
            var id = 'ex-opt-' + i;
            var label = document.createElement('label');
            label.htmlFor = id;
            var input = document.createElement('input');
            input.type = 'radio';
            input.name = 'ex_q_' + state.idx;
            input.id = id;
            input.value = opt;
            if (state.answers[state.idx] === opt) {
                input.checked = true;
                label.classList.add('picked');
            }
            input.addEventListener('change', function () {
                state.answers[state.idx] = opt;
                $('#ex-validation').textContent = '';
                Array.prototype.forEach.call(box.querySelectorAll('label'), function (l) {
                    l.classList.toggle('picked', l.querySelector('input').checked);
                });
            });
            label.appendChild(input);
            var span = document.createElement('span');
            span.textContent = opt;
            span.style.flex = '1';
            label.appendChild(span);
            box.appendChild(label);
        });
        $('#ex-validation').textContent = '';
        var nextBtn = $('#ex-next');
        nextBtn.textContent = (state.idx + 1 === state.questions.length) ? 'Submit' : 'Next';
    }

    function onNext() {
        var picked = state.answers[state.idx];
        if (!picked) {
            $('#ex-validation').textContent = 'Please select an answer to continue.';
            return;
        }
        if (state.idx + 1 < state.questions.length) {
            state.idx += 1;
            renderQuestion();
        } else {
            finish();
        }
    }

    var STOP = ('a an the of is are was were be been being to from in on at and or '
              + 'but if then so that this these those it its which who whom whose '
              + 'what when where why how do does did doing done has have had with by '
              + 'for as not no yes your you we they he she him her his their our')
              .split(' ');
    var STOPSET = {}; STOP.forEach(function (s) { STOPSET[s] = 1; });
    function topicKey(prompt, answer) {
        var a = (answer || '').trim();
        if (a && a.length >= 3 && a.split(/\s+/).length <= 4) return a;
        var toks = (prompt || '').toLowerCase().replace(/[^a-zA-Zऀ-ॿ\s]/g, ' ').split(/\s+/);
        toks = toks.filter(function (t) { return t.length >= 4 && !STOPSET[t]; });
        if (!toks.length) return (prompt || '').split(/\s+/).slice(0, 4).join(' ');
        toks.sort(function (x, y) { return y.length - x.length; });
        return toks[0];
    }

    // Resources-page-style card for a single recommendation. Mirrors the
    // markup `makeActivityButton()` in PHP emits so clicking the card hands
    // off to LOOMA.playMedia (already loaded via js-includes.php) which
    // routes to /video, /pdf, /image, etc. based on `data-ft`.
    var TYPE_ICONS = {
        video: 'images/video.png', mp4: 'images/video.png', m4v: 'images/video.png',
        mov: 'images/video.png', mp5: 'images/video.png', evi: 'images/video.png',
        audio: 'images/audio.png', mp3: 'images/audio.png', m4a: 'images/audio.png',
        image: 'images/picture.png', jpg: 'images/picture.png', jpeg: 'images/picture.png',
        png: 'images/picture.png', gif: 'images/picture.png',
        pdf: 'images/pdf.png', book: 'images/book.png', textbook: 'images/book.png',
        chapter: 'images/book.png', document: 'images/pdf.png',
        lesson: 'images/lesson.png', slideshow: 'images/slideshow.png',
        game: 'images/games.png', exercise: 'images/games.png', vocab: 'images/games.png',
        voc: 'images/games.png',
        map: 'images/maps.png', html: 'images/html.png',
        ep: 'images/ep.png', epaath: 'images/ep.png',
        history: 'images/history.png', text: 'images/textfile.png',
    };
    function iconFor(ft) {
        var key = String(ft || '').toLowerCase();
        return TYPE_ICONS[key] || 'images/alert.jpg';
    }
    function stripExt(fn) {
        if (!fn) return '';
        var i = fn.lastIndexOf('.');
        return i > 0 ? fn.substring(0, i) : fn;
    }
    // Build the same kind of "activity play img" button the Resources page
    // does. We give it data-* attrs that LOOMA.playMedia recognises so a
    // click navigates to the matching content viewer (/video, /pdf, /image
    // etc.) — the same destination the user gets from the chapter Resources
    // page, no special routing here.
    function buildRecCard(it) {
        var ft = String(it.ft || '').toLowerCase();
        var dn = it.dn || it.fn || it.id || '(unnamed)';
        var fp = it.fp || '';
        var fn = it.fn || '';
        var btn = document.createElement('button');
        btn.className = 'activity play img reco-card';
        btn.type = 'button';
        if (ft) btn.setAttribute('data-ft', ft);
        if (dn) btn.setAttribute('data-dn', dn);
        if (fp) btn.setAttribute('data-fp', fp);
        if (fn) btn.setAttribute('data-fn', fn);
        if (it.id) {
            btn.setAttribute('data-id', it.id);
            btn.setAttribute('data-mongoid', it.id);
        }
        if (CTX.chapterId) btn.setAttribute('data-ch', CTX.chapterId);
        if (CTX.language)  btn.setAttribute('data-lang', CTX.language);
        if (CTX.grade)     btn.setAttribute('data-grade', CTX.grade);
        if (CTX.subject)   btn.setAttribute('data-subject', CTX.subject);

        // Big thumb: try the conventional `<fp><fn-stem>_thumb.jpg`; fall
        // back to the type icon. Resources page does the same dance via the
        // PHP `thumbnail()` helper.
        var thumbUrl = (fp && fn) ? (fp + stripExt(fn) + '_thumb.jpg') : '';
        var img = document.createElement('img');
        img.alt = '';
        img.draggable = false;
        img.loading = 'lazy';
        img.src = thumbUrl || iconFor(ft);
        img.addEventListener('error', function () {
            if (img.src !== iconFor(ft)) img.src = iconFor(ft);
        });
        btn.appendChild(img);

        var label = document.createElement('span');
        label.className = 'reco-card-label';
        label.textContent = dn;
        btn.appendChild(label);

        // Small overlay icon in the corner so the file type is always visible
        // even when the big thumb covers most of the card (matches the PHP
        // makeActivityButton "data-ft icon" overlay).
        var typeIcon = document.createElement('img');
        typeIcon.className = 'icon';
        typeIcon.src = iconFor(ft);
        typeIcon.alt = ft;
        btn.appendChild(typeIcon);

        if (it.matched_topic) {
            var topic = document.createElement('span');
            topic.className = 'reco-card-topic';
            topic.textContent = 'about: ' + it.matched_topic;
            btn.appendChild(topic);
        }

        // Click handoff to the standard Looma content viewer.
        btn.addEventListener('click', function () {
            if (window.LOOMA && typeof LOOMA.playMedia === 'function') {
                LOOMA.playMedia(btn);
            }
        });
        return btn;
    }

    function finish() {
        var correct = 0, weak = [];
        state.questions.forEach(function (q, i) {
            if (String(state.answers[i] || '').trim() === String(q.answer || '').trim()) {
                correct += 1;
            } else {
                var t = topicKey(q.prompt, q.answer);
                if (t) weak.push(t);
            }
        });
        var total = state.questions.length;
        var pct = total ? Math.round(correct / total * 100) : 0;

        $('#ex-question-card').style.display = 'none';
        $('#ex-result-card').style.display = '';
        $('#ex-result-score').textContent = pct + '%';
        $('#ex-result-detail').textContent = correct + ' correct out of ' + total;

        try {
            fetch('looma-telemetry.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
                body: JSON.stringify({
                    event: 'score',
                    activity: 'exercise',
                    chapter_id: CTX.chapterId,
                    grade:    CTX.grade    || null,
                    subject:  CTX.subject  || null,
                    language: CTX.language || null,
                    correct: correct, total: total,
                    score: total ? (correct / total) : 0,
                    score_pct: pct,
                    weak_topics: weak,
                })
            }).catch(function () {});
        } catch (_) {}

        var rUrl = AI_BASE + '/recommend_after_score?chapter_id=' + encodeURIComponent(CTX.chapterId)
                 + '&subject='  + encodeURIComponent(CTX.subject || '')
                 + '&grade='    + encodeURIComponent(CTX.grade || '')
                 + '&language=' + encodeURIComponent(CTX.language || '')
                 + '&score='    + encodeURIComponent((total ? (correct / total) : 0).toFixed(4))
                 + '&weak_topics=' + encodeURIComponent(weak.slice(0, 5).join(','));
        fetch(rUrl).then(function (r) { return r.json(); }).then(function (j) {
            var box = $('#ex-result-recos');
            box.innerHTML = '';
            if (!j || !j.ok) return;
            if (j.mastered) {
                var h = document.createElement('h3');
                h.textContent = 'Great work — you have mastered this chapter!';
                h.style.color = '#1f6f3a';
                box.appendChild(h);
                if (j.did_you_know) {
                    var d = document.createElement('div');
                    d.className = 'didyouknow';
                    d.innerHTML = '<b>Did you know?</b> ' + escapeHtml(j.did_you_know);
                    box.appendChild(d);
                }
                return;
            }
            var rec = j.recommendations || {};
            var groups = [['videos','Videos to watch'],['books','Books to read'],['files','Other study materials']];
            var any = false;
            groups.forEach(function (g) {
                var arr = rec[g[0]] || [];
                if (!arr.length) return;
                any = true;
                var h = document.createElement('h3');
                h.textContent = g[1]; box.appendChild(h);
                var grid = document.createElement('div');
                grid.className = 'reco-grid';
                arr.forEach(function (it) { grid.appendChild(buildRecCard(it)); });
                box.appendChild(grid);
            });
            if (any && Array.isArray(j.weak_topics) && j.weak_topics.length) {
                var hdr = document.createElement('p');
                hdr.innerHTML = '<b>Topics to review:</b> ' + j.weak_topics.map(escapeHtml).join(', ');
                box.insertBefore(hdr, box.firstChild);
            } else if (!any && j.did_you_know) {
                var p = document.createElement('p');
                p.textContent = "We couldn't find study resources for those topics. Here's something to think about:";
                box.appendChild(p);
                var d = document.createElement('div');
                d.className = 'didyouknow';
                d.innerHTML = '<b>Did you know?</b> ' + escapeHtml(j.did_you_know);
                box.appendChild(d);
            }
        }).catch(function () {});
    }

    document.addEventListener('DOMContentLoaded', function () {
        $('#ex-next').addEventListener('click', onNext);
        $('#ex-retry').addEventListener('click', function () {
            $('#ex-result-card').style.display = 'none';
            $('#ex-question-card').style.display = '';
            state.idx = 0;
            state.answers = state.questions.map(function () { return null; });
            renderQuestion();
        });
        $('#ex-back-resources').addEventListener('click', function () {
            window.location = 'activities?ch=' + encodeURIComponent(CTX.chapterId);
        });
        load();
    });
})();
