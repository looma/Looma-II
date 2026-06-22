import argparse
import hashlib
import json
import random
import re
import sqlite3
from datetime import datetime, timezone


import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))
from sklearn.feature_extraction.text import TfidfVectorizer


DB_PATH = str(_PROJECT_ROOT / 'data' / 'index' / 'looma.db')


PT_STOP = {
    'a', 'o', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das',
    'e', 'ou', 'para', 'por', 'com', 'sem', 'em', 'no', 'na', 'nos', 'nas', 'ao', 'à',
    'que', 'quem', 'qual', 'quais', 'quando', 'onde', 'como', 'porque', 'porquê',
    'mais', 'menos', 'muito', 'pouco', 'também', 'já', 'ainda', 'só', 'se', 'ser',
    'é', 'são', 'foi', 'foram', 'era', 'eram', 'sua', 'seu', 'suas', 'seus',
}

EN_STOP = {
    'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'with', 'without',
    'that', 'this', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
    'it', 'as', 'at', 'by', 'from', 'into', 'about', 'over', 'under', 'than',
    'what', 'when', 'where', 'who', 'which', 'why', 'how', 'your', 'their',
}


def stable_id(prefix: str, *parts: str) -> str:
    h = hashlib.sha256('||'.join(parts).encode('utf-8')).hexdigest()[:20]
    return f'{prefix}_{h}'


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def split_sentences(text: str):
    text = re.sub(r'\s+', ' ', text).strip()
    if not text:
        return []
    # Include Nepali danda "।" as an end-of-sentence marker.
    parts = re.split(r'(?<=[\.\!\?\u0964])\s+', text)
    out = []
    for p in parts:
        p = p.strip()
        if len(p) < 25:
            continue
        out.append(p)
    return out


def compute_keywords(chunks_text, *, limit=12):
    if not chunks_text:
        return []

    texts = [t.strip() for t in chunks_text if isinstance(t, str) and t.strip()]
    if not texts:
        return []

    def run_tfidf(token_pattern: str):
        vectorizer = TfidfVectorizer(
            lowercase=True,
            stop_words=sorted(PT_STOP | EN_STOP),
            token_pattern=token_pattern,
            ngram_range=(1, 2),
            max_features=5000,
        )
        try:
            X = vectorizer.fit_transform(texts)
        except ValueError:
            return None, None
        if X.shape[1] == 0:
            return None, None
        return vectorizer, X

    # Some chapters end up with only stop-words / very short tokens; avoid crashing.
    # Include Devanagari tokens for Nepali.
    vectorizer, X = run_tfidf(r'(?u)\b[0-9A-Za-z\u0900-\u097FÀ-ÿ_]{3,}\b')
    if vectorizer is None:
        vectorizer, X = run_tfidf(r'(?u)\b[0-9A-Za-z\u0900-\u097FÀ-ÿ_]{2,}\b')
    if vectorizer is None:
        return []

    scores = X.mean(axis=0).A1
    terms = vectorizer.get_feature_names_out()
    ranked = sorted(zip(terms, scores), key=lambda x: (-x[1], x[0]))

    keywords = []
    for term, _ in ranked:
        term = term.strip()
        if not term:
            continue
        if term in PT_STOP or term in EN_STOP:
            continue
        keywords.append(term)
        if len(keywords) >= limit:
            break

    return keywords


def summarize(chunks_text, *, sentence_limit=5, keywords=None, language=None, keyword_boost=None):
    """Extractive summarization using TF-IDF + position scoring + MMR diversity.

    Algorithm:
    1. Score sentences by TF-IDF relevance to the chapter vocabulary.
    2. Boost scores for sentences near the beginning (definitions appear early).
    3. Optionally boost sentences matching teacher-preferred keywords (keyword_boost).
    4. Use Maximal Marginal Relevance (MMR) to select sentences that are both
       relevant AND diverse, avoiding near-duplicate content.
    5. Restore document order so the paragraph reads naturally.
    """
    texts = [t.strip() for t in chunks_text if isinstance(t, str) and t.strip()]
    full = '\n'.join(texts)
    sents = split_sentences(full)
    if not sents:
        return ''

    if keywords is None:
        try:
            keywords = compute_keywords(chunks_text, limit=12)
        except Exception:
            keywords = []

    def clean_sentence(s: str) -> str:
        s = re.sub(r'\s+', ' ', s).strip()
        s = re.sub(r'\bPage\s+\d+\b', '', s, flags=re.IGNORECASE).strip()
        s = re.sub(r'[~`_]{2,}', ' ', s)
        s = re.sub(r'[\xb7•]{2,}', ' ', s)
        s = re.sub(r'\s+', ' ', s).strip()
        return s

    def is_good_sentence(s: str) -> bool:
        if not s or len(s) < 40:
            return False
        if 'http://' in s or 'https://' in s or 'www.' in s:
            return False
        # Skip captions, list starters, and section headings.
        if re.match(
            r'^(figure|table|activity|exercise|note|example|chapter|unit|section)\b',
            s.strip(), flags=re.IGNORECASE
        ):
            return False
        # Skip ALL-CAPS fragments (headings / labels from PDF extraction).
        if re.match(r'^[A-Z\s\d\.\/-]{6,}$', s.strip()):
            return False
        # Require a healthy ratio of alphabetic characters (filters OCR garbage).
        letters = len(re.findall(r'[A-Za-zऀ-ॿ\xc0-\xff]', s))
        if letters / max(1, len(s)) < 0.50:
            return False
        return True

    # --- TF-IDF scoring ---
    def run_tfidf(token_pattern: str):
        vectorizer = TfidfVectorizer(
            lowercase=True,
            stop_words=sorted(PT_STOP | EN_STOP),
            token_pattern=token_pattern,
            ngram_range=(1, 2),
            max_features=8000,
        )
        try:
            X = vectorizer.fit_transform(sents)
        except ValueError:
            return None
        return X if X.shape[1] > 0 else None

    X = run_tfidf(r'(?u)\b[0-9A-Za-zऀ-ॿ\xc0-\xff_]{3,}\b')
    if X is None:
        X = run_tfidf(r'(?u)\b[0-9A-Za-zऀ-ॿ\xc0-\xff_]{2,}\b')

    n = len(sents)
    tfidf_scores = X.sum(axis=1).A1.tolist() if X is not None else [1.0] * n

    # --- Position score: early sentences carry definitions and core concepts ---
    def position_score(idx: int, total: int) -> float:
        if total <= 1:
            return 1.0
        frac = idx / (total - 1)
        if frac < 0.12:
            return 1.35   # very opening sentences
        if frac < 0.30:
            return 1.15
        if frac > 0.85:
            return 1.05   # concluding sentences
        return 1.0

    # --- Keyword boost: teacher-preferred terms lift their containing sentences ---
    boost_terms = set(k.lower() for k in (keyword_boost or []) if k)

    def boosted(sent: str, base: float) -> float:
        if not boost_terms:
            return base
        words = set(re.findall(r'\b\w{3,}\b', sent.lower()))
        return base * (1.0 + 0.18 * len(words & boost_terms))

    relevance = [
        boosted(sents[i], tfidf_scores[i] * position_score(i, n))
        for i in range(n)
    ]

    # --- MMR selection: balance relevance vs. diversity ---
    # lambda=0.65 keeps more relevance weight than diversity.
    lambda_mmr = 0.65
    target = max(1, int(sentence_limit))

    def word_set(s: str) -> set:
        return set(re.findall(r'\b\w{3,}\b', s.lower()))

    def overlap_sim(sa: set, sb: set) -> float:
        if not sa or not sb:
            return 0.0
        return len(sa & sb) / max(len(sa | sb), 1)

    candidates = list(range(n))
    selected: list = []
    selected_wsets: list = []

    while candidates and len(selected) < target:
        best_ci = None
        best_score = -1e9

        for ci in candidates:
            s = clean_sentence(sents[ci])
            if not is_good_sentence(s):
                continue
            rel = relevance[ci]
            if not selected_wsets:
                score = rel
            else:
                max_sim = max(overlap_sim(word_set(s), ss) for ss in selected_wsets)
                score = lambda_mmr * rel - (1.0 - lambda_mmr) * max_sim
            if score > best_score:
                best_score = score
                best_ci = ci

        if best_ci is None:
            break

        candidates.remove(best_ci)
        s = clean_sentence(sents[best_ci])
        selected.append(best_ci)
        selected_wsets.append(word_set(s))

    # Restore narrative order so the paragraph reads naturally.
    selected.sort()

    out = []
    seen: set = set()
    for i in selected:
        s = clean_sentence(sents[i])
        key = s.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(s)

    # Last resort: quality filter rejected everything — grab first clean sentence.
    if not out:
        for s_raw in sents[:15]:
            s = clean_sentence(s_raw)
            if len(s) > 30:
                out.append(s)
                break

    summary = ' '.join(out).strip()
    if summary and summary[-1] not in '.!?…':
        summary += '.'
    return summary

def best_sentence_for_keyword(chunks_text, keyword: str):
    kw = keyword.lower()
    best = ''
    for text in chunks_text:
        for sent in split_sentences(text):
            if kw in sent.lower():
                if len(sent) > len(best):
                    best = sent
    return best


def generate_objectives(chunks_text, keywords, *, limit=5, language=None):
    """
    Build a short list of chapter learning objectives.

    Strategy:
      1. Look for sentences that already match the textbook idiom for
         objectives ("Students will ...", "By the end of this chapter ...",
         "Learners can ..."). Those are gold and we use them verbatim.
      2. Fall back to template-style objectives ("Understand <keyword>",
         "Identify <keyword>", "Explain <keyword>") so even chapters that
         don't spell out objectives get a usable list.

    Returns a list of strings — never longer than `limit`.
    """
    if limit < 1:
        limit = 1

    objectives = []
    seen = set()

    def add(obj: str):
        s = (obj or '').strip().rstrip('.')
        if not s:
            return
        key = s.lower()
        if key in seen:
            return
        seen.add(key)
        if not s.endswith('.'):
            s += '.'
        objectives.append(s)

    PATTERNS = [
        re.compile(r'^(?:students?|learners?|pupils?|the\s+student|the\s+reader)\s+(?:will|should|can|are\s+expected\s+to)\b.*', re.IGNORECASE),
        re.compile(r'^by\s+the\s+end\s+of\s+this\s+(?:chapter|lesson|unit).*', re.IGNORECASE),
        re.compile(r'^the\s+goal\s+of\s+this\s+(?:chapter|lesson|unit).*', re.IGNORECASE),
        re.compile(r'^this\s+(?:chapter|lesson|unit)\s+(?:will\s+)?teach(?:es)?\b.*', re.IGNORECASE),
    ]

    # 1. Mine the chapter sentences for explicit-objective phrasing.
    for text in chunks_text or []:
        for sent in split_sentences(text):
            s = (sent or '').strip()
            if len(s) < 15 or len(s) > 220:
                continue
            for pat in PATTERNS:
                if pat.match(s):
                    add(s)
                    break
            if len(objectives) >= limit:
                break
        if len(objectives) >= limit:
            break

    # 2. Pad with template-derived objectives from the top keywords.
    VERBS = ['Understand', 'Identify', 'Explain', 'Describe', 'Apply', 'Recognize']
    i = 0
    for kw in (keywords or []):
        if len(objectives) >= limit:
            break
        kw_clean = (kw or '').strip()
        if not kw_clean or len(kw_clean) > 40:
            continue
        verb = VERBS[i % len(VERBS)]
        i += 1
        add(f'{verb} the concept of "{kw_clean}".')

    return objectives[:limit]


def generate_flashcards(chunks_text, keywords, *, limit=12):
    cards = []
    for kw in keywords[:limit]:
        sent = best_sentence_for_keyword(chunks_text, kw)
        if not sent:
            continue
        cards.append({'front': kw, 'back': sent})
    return cards


def make_cloze(sentence: str, keyword: str):
    pattern = re.compile(re.escape(keyword), re.IGNORECASE)
    masked, n = pattern.subn('____', sentence, count=1)
    if n == 0:
        return None
    return masked


def generate_vocab_practice(chunks_text, keywords, *, n_questions=10, seed=0):
    """
    Lightweight keyword practice (cloze + keyword MCQ).

    Kept intentionally simple/fast, since Looma runs on low-power machines.
    """
    rnd = random.Random(seed)
    questions = []

    candidates = []
    for kw in keywords:
        sent = best_sentence_for_keyword(chunks_text, kw)
        if sent:
            candidates.append((kw, sent))

    rnd.shuffle(candidates)

    # Cloze
    for kw, sent in candidates:
        if len(questions) >= n_questions // 2:
            break
        masked = make_cloze(sent, kw)
        if not masked:
            continue
        questions.append({'type': 'cloze', 'prompt': masked, 'answer': kw})

    # Keyword MCQ (answer is the missing keyword)
    distractors_pool = [k for k in keywords if k]
    rnd.shuffle(distractors_pool)

    for kw, sent in candidates:
        if len(questions) >= n_questions:
            break
        masked = make_cloze(sent, kw)
        if not masked:
            continue

        distractors = [d for d in distractors_pool if d.lower() != kw.lower()]
        distractors = distractors[:3]
        if len(distractors) < 3:
            continue

        options = [kw] + distractors
        rnd.shuffle(options)
        questions.append({'type': 'mcq', 'prompt': masked, 'options': options, 'answer': kw})

    return questions[:n_questions]


def generate_quiz(chunks_text, keywords, *, n_questions=10, seed=0):
    """
    Exercises-style quiz (MCQ only).

    Each question has 4 answer options, with exactly one correct option.
    """
    rnd = random.Random(seed)

    pairs = []
    for kw in keywords:
        w = (kw or '').strip()
        if not w:
            continue
        definition = (best_sentence_for_keyword(chunks_text, w) or '').strip()
        if not definition:
            continue
        pairs.append((w, definition))

    # Prefer shorter, clearer definitions.
    pairs.sort(key=lambda p: len(p[1]))
    rnd.shuffle(pairs)

    # Build a pool of distinct definitions for distractors.
    defs_pool = []
    seen = set()
    for _, d in pairs:
        key = d.strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        defs_pool.append(d.strip())

    questions = []
    for word, definition in pairs:
        if len(questions) >= n_questions:
            break
        if not definition.strip():
            continue

        distractors = [d for d in defs_pool if d.strip().lower() != definition.strip().lower()]
        rnd.shuffle(distractors)
        distractors = distractors[:3]
        if len(distractors) < 3:
            continue

        options = [definition] + distractors
        rnd.shuffle(options)
        questions.append(
            {
                'type': 'mcq',
                'prompt': f'What is the best definition of \"{word}\"?',
                'options': options,
                'answer': definition,
            }
        )

    return questions[:n_questions]


def _question_pool_from_sentences(chunks_text, keywords, rnd):
    """Walk every sentence in the chapter, scan for templatable patterns and
    emit a candidate Wh-question for it.

    Patterns look for phrases the textbook authors use a lot ("X is the …",
    "Because …", "In <year>/<place>, X …", "Y was invented by Z", etc.). The
    generator is purely rule-based — no LLM call — so this stays fast and
    deterministic on Looma's low-power hardware.
    """
    out = []
    kw_lower = {(k or '').strip().lower() for k in keywords if (k or '').strip()}
    for text in chunks_text:
        for sent in split_sentences(text):
            s = (sent or '').strip()
            if len(s) < 25 or len(s) > 280:
                continue
            sl = s.lower()
            # "X is the / are the / was the / were the …"  ->  "What is X?"
            m = re.match(r'^([A-Z][\w\s\-]{2,40}?)\s+(is|are|was|were)\s+(?:a|an|the)\s+(.+)$', s)
            if m:
                subject = m.group(1).strip()
                rest    = m.group(3).strip().rstrip('.').rstrip(',')
                if 6 <= len(rest) <= 180:
                    out.append({
                        'type': 'mcq',
                        'kind': 'what',
                        'subject': subject,
                        'prompt': f'What is {subject.lower()}?',
                        'answer': rest,
                    })
                    continue

            # "Because <reason>, <effect>." or "<effect> because <reason>."  -> "Why …?"
            m = re.match(r'^Because\s+(.+?),\s*(.+)$', s, re.IGNORECASE)
            if m:
                reason = m.group(1).strip()
                effect = m.group(2).strip().rstrip('.')
                if 6 <= len(reason) <= 200 and 6 <= len(effect) <= 200:
                    out.append({
                        'type': 'mcq',
                        'kind': 'why',
                        'prompt': f'Why {effect.lower()}?',
                        'answer': reason,
                    })
                    continue
            m = re.search(r'^(.+?)\s+because\s+(.+)$', s, re.IGNORECASE)
            if m:
                effect = m.group(1).strip().rstrip(',')
                reason = m.group(2).strip().rstrip('.')
                if 6 <= len(reason) <= 200 and 6 <= len(effect) <= 200:
                    out.append({
                        'type': 'mcq',
                        'kind': 'why',
                        'prompt': f'Why {effect.lower()}?',
                        'answer': reason,
                    })
                    continue

            # "In <year> …" -> "When …?"
            m = re.match(r'^In\s+(\d{3,4})[, ]\s*(.+)$', s)
            if m:
                year   = m.group(1)
                rest   = m.group(2).strip().rstrip('.')
                if 8 <= len(rest) <= 180:
                    out.append({
                        'type': 'mcq',
                        'kind': 'when',
                        'prompt': f'When {rest.lower().rstrip("?.").rstrip()}?',
                        'answer': year,
                    })
                    continue

            # "<X> was invented / discovered / written / founded by <Y>" -> "Who …?"
            m = re.search(r'(.+?)\s+(?:was|were)\s+(invented|discovered|written|founded|created|built|composed|directed|painted|developed)\s+by\s+(.+)$', s, re.IGNORECASE)
            if m:
                what   = m.group(1).strip()
                verb   = m.group(2).strip().lower()
                who    = m.group(3).strip().rstrip('.').rstrip(',')
                if 3 <= len(who) <= 80:
                    out.append({
                        'type': 'mcq',
                        'kind': 'who',
                        'prompt': f'Who {verb} {what.lower()}?',
                        'answer': who,
                    })
                    continue

            # "<X> is located in / found in <Y>" -> "Where …?"
            m = re.search(r'(.+?)\s+(?:is|are)\s+(?:located|found|situated)\s+in\s+(.+)$', s, re.IGNORECASE)
            if m:
                what  = m.group(1).strip()
                where = m.group(2).strip().rstrip('.').rstrip(',')
                if 3 <= len(where) <= 80:
                    out.append({
                        'type': 'mcq',
                        'kind': 'where',
                        'prompt': f'Where {what.lower().rstrip(".")} located?',
                        'answer': where,
                    })
                    continue

            # Fallback: cloze a keyword sitting in this sentence -> "Which word completes …?"
            for kw in keywords:
                k = (kw or '').strip()
                if not k:
                    continue
                if k.lower() in sl and 3 <= len(k) <= 24:
                    masked = make_cloze(s, k)
                    if masked:
                        out.append({
                            'type': 'mcq',
                            'kind': 'cloze',
                            'prompt': f'Which word completes the sentence: "{masked}"?',
                            'answer': k,
                        })
                        break
    rnd.shuffle(out)
    return out


def generate_quiz_v2(chunks_text, keywords, dict_entries=None, *, n_questions=10, seed=0):
    """
    Mixed-format chapter quiz: definitions + Wh-questions + cloze, with
    natural-sounding prompts and 4 options each.

    `dict_entries` is an optional dict of {keyword: {'def': str, ...}} pulled
    from the Looma dictionary collection — when present we use the dictionary's
    definition for the "What is X?" answer instead of the longest sentence
    containing the keyword. Definitions from the dictionary read more naturally
    than auto-extracted sentences.
    """
    rnd = random.Random(seed)
    dict_entries = dict_entries or {}

    # Bucket 1: dictionary definition questions ("What is photosynthesis?")
    def_pool = []
    for kw in keywords:
        w = (kw or '').strip()
        if not w:
            continue
        defn = ''
        entry = dict_entries.get(w) or dict_entries.get(w.lower()) or {}
        if isinstance(entry, dict):
            defn = (entry.get('def') or '').strip()
        if not defn:
            defn = (best_sentence_for_keyword(chunks_text, w) or '').strip()
        if not defn or len(defn) < 12:
            continue
        def_pool.append((w, defn))

    # Bucket 2: cloze + Wh-question pool, mined from the chapter sentences.
    sent_pool = _question_pool_from_sentences(chunks_text, keywords, rnd)

    # All distinct definitions, used to pad distractor lists for definition Qs.
    defs_universe = list({d for _, d in def_pool})
    rnd.shuffle(defs_universe)

    # Distractor pools per Wh-kind (use answers from the same kind so options
    # look type-consistent — e.g. "Why?" gets reason-shaped distractors).
    by_kind = {}
    for q in sent_pool:
        by_kind.setdefault(q['kind'], []).append(q['answer'])

    questions = []
    seen_prompts = set()

    def add_q(q):
        prompt = (q.get('prompt') or '').strip()
        answer = (q.get('answer') or '').strip()
        opts   = q.get('options') or []
        if not prompt or not answer or len(opts) != 4:
            return
        key = prompt.lower()
        if key in seen_prompts:
            return
        seen_prompts.add(key)
        questions.append({
            'type': q.get('type') or 'mcq',
            'prompt': prompt,
            'options': opts,
            'answer': answer,
            'kind': q.get('kind') or 'mixed',
        })

    # Target mix: aim for 1/3 definitions, 2/3 sentence-based.
    n_defs = max(1, n_questions // 3)
    rnd.shuffle(def_pool)

    # Definition questions
    for w, defn in def_pool:
        if sum(1 for q in questions if q['kind'] == 'what') >= n_defs:
            break
        distractors = [d for d in defs_universe if d.strip().lower() != defn.strip().lower()]
        rnd.shuffle(distractors)
        distractors = distractors[:3]
        if len(distractors) < 3:
            continue
        options = [defn] + distractors
        rnd.shuffle(options)
        add_q({
            'type': 'mcq',
            'kind': 'what',
            'prompt': f'What is the meaning of "{w}"?',
            'options': options,
            'answer': defn,
        })

    # Sentence-based questions (Wh + cloze)
    for q in sent_pool:
        if len(questions) >= n_questions:
            break
        kind = q.get('kind')
        answer = (q.get('answer') or '').strip()
        if not answer:
            continue
        if kind == 'cloze':
            # Distractors: other keywords (same chapter), filter out near-duplicates.
            pool = [k for k in keywords if (k or '').strip() and (k or '').strip().lower() != answer.lower()]
            rnd.shuffle(pool)
            distractors = pool[:3]
        else:
            pool = list({a for a in by_kind.get(kind, []) if a.strip().lower() != answer.strip().lower()})
            rnd.shuffle(pool)
            distractors = pool[:3]
            # Top-up with answers from any kind so we always have 4 options.
            if len(distractors) < 3:
                spare = [a for a in (a for v in by_kind.values() for a in v)
                         if a.strip().lower() != answer.strip().lower()
                         and a not in distractors]
                rnd.shuffle(spare)
                distractors += spare[: 3 - len(distractors)]
        if len(distractors) < 3:
            continue
        options = [answer] + distractors
        rnd.shuffle(options)
        add_q({**q, 'options': options})

    # If under-target (very small chapters), backfill with definition questions.
    for w, defn in def_pool:
        if len(questions) >= n_questions:
            break
        if any(q['answer'].strip().lower() == defn.strip().lower() for q in questions):
            continue
        distractors = [d for d in defs_universe if d.strip().lower() != defn.strip().lower()]
        rnd.shuffle(distractors)
        distractors = distractors[:3]
        if len(distractors) < 3:
            continue
        options = [defn] + distractors
        rnd.shuffle(options)
        add_q({
            'type': 'mcq',
            'kind': 'what',
            'prompt': f'What is the meaning of "{w}"?',
            'options': options,
            'answer': defn,
        })

    return questions[:n_questions]


# --- Activity / Exercise block → multiple practice variants ------------------
#
# `_ARITH_PATTERNS` describes the worked-example statements we recognise inside
# textbook activity blocks. For each match, `generate_activity_variants` can
# regenerate the same problem with fresh numbers and a freshly computed
# answer, which gives every learner a different drill from the same source
# activity. The patterns are written for the CEHRD curriculum English text;
# we deliberately keep them simple/regex-based so the generator stays
# deterministic and fast on Looma's low-power hardware.

_ARITH_PATTERNS = [
    # --- addition ---
    {
        'name': 'sum',
        'arity': 2,
        'regex': re.compile(r'(?i)\b(?:find\s+the\s+)?sum\s+of\s+(\d{1,4})\s+and\s+(\d{1,4})\b'),
        'template': 'Find the sum of {a} and {b}.',
        'compute': lambda a, b: a + b,
        'range': (5, 99),
    },
    {
        'name': 'add',
        'arity': 2,
        'regex': re.compile(r'(?i)\badd\s+(\d{1,4})\s+(?:and|to)\s+(\d{1,4})\b'),
        'template': 'Add {a} and {b}.',
        'compute': lambda a, b: a + b,
        'range': (5, 99),
    },
    {
        'name': 'plus',
        'arity': 2,
        'regex': re.compile(r'(?<!\d)(\d{1,4})\s*\+\s*(\d{1,4})(?!\d)'),
        'template': '{a} + {b} = ?',
        'compute': lambda a, b: a + b,
        'range': (5, 99),
    },
    # --- subtraction ---
    {
        'name': 'subtract',
        'arity': 2,
        'regex': re.compile(r'(?i)\bsubtract\s+(\d{1,4})\s+from\s+(\d{1,4})\b'),
        'template': 'Subtract {a} from {b}.',
        # subtract a from b => b - a
        'compute': lambda a, b: b - a,
        'range': (2, 80),
        'constraint': 'a_lt_b',
    },
    {
        'name': 'difference',
        'arity': 2,
        'regex': re.compile(r'(?i)\b(?:find\s+the\s+)?difference\s+(?:between|of)\s+(\d{1,4})\s+(?:and|-)\s+(\d{1,4})\b'),
        'template': 'Find the difference between {a} and {b}.',
        'compute': lambda a, b: abs(a - b),
        'range': (5, 99),
    },
    {
        'name': 'minus',
        'arity': 2,
        'regex': re.compile(r'(?<!\d)(\d{1,4})\s*[\-−]\s*(\d{1,4})(?!\d)'),
        'template': '{a} − {b} = ?',
        'compute': lambda a, b: a - b,
        'range': (10, 99),
        'constraint': 'a_ge_b',
    },
    # --- multiplication ---
    {
        'name': 'multiply',
        'arity': 2,
        'regex': re.compile(r'(?i)\bmultiply\s+(\d{1,4})\s+(?:by|and|with)\s+(\d{1,4})\b'),
        'template': 'Multiply {a} by {b}.',
        'compute': lambda a, b: a * b,
        'range': (2, 15),
    },
    {
        'name': 'product',
        'arity': 2,
        'regex': re.compile(r'(?i)\b(?:find\s+the\s+)?product\s+of\s+(\d{1,4})\s+and\s+(\d{1,4})\b'),
        'template': 'Find the product of {a} and {b}.',
        'compute': lambda a, b: a * b,
        'range': (2, 15),
    },
    {
        'name': 'times',
        'arity': 2,
        'regex': re.compile(r'(?<!\d)(\d{1,3})\s*[×x*]\s*(\d{1,3})(?!\d)'),
        'template': '{a} × {b} = ?',
        'compute': lambda a, b: a * b,
        'range': (2, 15),
    },
    # --- division ---
    {
        'name': 'divide',
        'arity': 2,
        'regex': re.compile(r'(?i)\bdivide\s+(\d{1,4})\s+by\s+(\d{1,3})\b'),
        'template': 'Divide {a} by {b}.',
        'compute': lambda a, b: a // b,
        'range': (2, 144),
        'constraint': 'b_divides_a',
    },
    {
        'name': 'quotient',
        'arity': 2,
        'regex': re.compile(r'(?i)\b(?:find\s+the\s+)?quotient\s+(?:of|when)\s+(\d{1,4})\s+(?:is\s+)?(?:divided\s+by|by|and)\s+(\d{1,3})\b'),
        'template': 'Find the quotient when {a} is divided by {b}.',
        'compute': lambda a, b: a // b,
        'range': (2, 144),
        'constraint': 'b_divides_a',
    },
    # --- percentage ---
    {
        'name': 'percent',
        'arity': 2,
        'regex': re.compile(r'(?i)(?:what\s+is\s+|find\s+)?(\d{1,3})\s*%\s+of\s+(\d{1,4})'),
        'template': 'What is {a}% of {b}?',
        'compute': lambda a, b: (a * b) // 100,
        'range': (5, 500),
        'constraint': 'percent_clean',
    },
    # --- geometry: rectangle ---
    {
        'name': 'area_rect',
        'arity': 2,
        'regex': re.compile(
            r'(?is)\barea\s+of\s+(?:a\s+|the\s+)?rectangle\b'
            r'.*?(?:length|l)\s*(?:is|=)?\s*(\d{1,3})'
            r'.*?(?:breadth|width|b|w)\s*(?:is|=)?\s*(\d{1,3})'
        ),
        'template': 'Find the area of a rectangle whose length is {a} cm and breadth is {b} cm.',
        'compute': lambda a, b: a * b,
        'unit': 'sq cm',
        'range': (3, 30),
    },
    {
        'name': 'perimeter_rect',
        'arity': 2,
        'regex': re.compile(
            r'(?is)\bperimeter\s+of\s+(?:a\s+|the\s+)?rectangle\b'
            r'.*?(?:length|l)\s*(?:is|=)?\s*(\d{1,3})'
            r'.*?(?:breadth|width|b|w)\s*(?:is|=)?\s*(\d{1,3})'
        ),
        'template': 'Find the perimeter of a rectangle with length {a} cm and breadth {b} cm.',
        'compute': lambda a, b: 2 * (a + b),
        'unit': 'cm',
        'range': (3, 30),
    },
    # --- geometry: square (single side) ---
    {
        'name': 'area_sq',
        'arity': 1,
        'regex': re.compile(r'(?is)\barea\s+of\s+(?:a\s+|the\s+)?square\b.*?side\s*(?:is|=)?\s*(\d{1,3})'),
        'template': 'Find the area of a square whose side is {a} cm.',
        'compute': lambda a: a * a,
        'unit': 'sq cm',
        'range': (3, 25),
    },
    {
        'name': 'perimeter_sq',
        'arity': 1,
        'regex': re.compile(r'(?is)\bperimeter\s+of\s+(?:a\s+|the\s+)?square\b.*?side\s*(?:is|=)?\s*(\d{1,3})'),
        'template': 'Find the perimeter of a square whose side is {a} cm.',
        'compute': lambda a: 4 * a,
        'unit': 'cm',
        'range': (3, 25),
    },
    # --- statistics: average of three numbers ---
    {
        'name': 'avg3',
        'arity': 3,
        'regex': re.compile(r'(?i)\b(?:find\s+the\s+)?average\s+of\s+(\d{1,4})[,\s]+(\d{1,4})\s+and\s+(\d{1,4})\b'),
        'template': 'Find the average of {a}, {b} and {c}.',
        'compute': lambda a, b, c: (a + b + c) // 3,
        'range': (3, 60),
        'constraint': 'avg_clean',
    },
]


# Word-problem vocabulary used by the templates below. Kept short / CEHRD-
# friendly so the resampled variants read naturally for Nepali learners.
_WP_NAMES = ['Ram', 'Sita', 'Hari', 'Gita', 'Anil', 'Bina', 'Krishna', 'Maya', 'Raj', 'Priya']
_WP_ITEMS = ['marbles', 'apples', 'pencils', 'mangoes', 'books', 'stamps', 'oranges', 'cards']
_WP_UNIT_ITEMS = [
    ('pen', 'pens'),
    ('book', 'books'),
    ('mango', 'mangoes'),
    ('apple', 'apples'),
    ('ball', 'balls'),
    ('orange', 'oranges'),
    ('notebook', 'notebooks'),
    ('eraser', 'erasers'),
]


# --- Flexible-API samplers ---------------------------------------------------
#
# These return a `values` dict that feeds both the prompt template (via
# str.format) and the `compute_v` callable that gives the correct answer.
# Underscore-prefixed keys (e.g. `_choices`) are read by the renderer for
# special answer types and are ignored by str.format.

def _sample_fraction_of(rng):
    d = rng.choice([2, 3, 4, 5, 6, 8])
    n = rng.randint(1, d - 1)
    k = rng.randint(2, 12)
    v = d * k
    return {'n': n, 'd': d, 'v': v}


def _sample_fraction_add_same_denom(rng):
    d = rng.randint(3, 8)
    a = rng.randint(1, d - 1)
    max_b = d - a - 1
    b = 1 if max_b < 1 else rng.randint(1, max_b)
    return {'a': a, 'b': b, 'd': d}


def _sample_unit_price(rng):
    item, items = rng.choice(_WP_UNIT_ITEMS)
    a = rng.randint(2, 50)
    b = rng.randint(2, 12)
    return {'item': item, 'items': items, 'a': a, 'b': b}


def _sample_compare(rng):
    a = rng.randint(10, 999)
    b = rng.randint(10, 999)
    while a == b:
        b = rng.randint(10, 999)
    return {'a': a, 'b': b, '_choices': [str(a), str(b)]}


def _sample_wp_add(rng):
    name1 = rng.choice(_WP_NAMES)
    name2 = rng.choice([n for n in _WP_NAMES if n != name1])
    items = rng.choice(_WP_ITEMS)
    a = rng.randint(5, 50)
    b = rng.randint(5, 50)
    return {'name1': name1, 'name2': name2, 'items': items, 'a': a, 'b': b}


def _sample_wp_sub(rng):
    name1 = rng.choice(_WP_NAMES)
    items = rng.choice(_WP_ITEMS)
    a = rng.randint(10, 80)
    b = rng.randint(2, a - 1)
    return {'name1': name1, 'items': items, 'a': a, 'b': b}


def _sample_power(rng):
    a = rng.randint(2, 12)
    b = rng.randint(2, 4)
    return {'a': a, 'b': b}


def _sample_eq_add(rng):
    x = rng.randint(2, 30)
    a = rng.randint(2, 30)
    return {'a': a, 'b': a + x}


def _sample_eq_sub(rng):
    x = rng.randint(2, 30)
    a = rng.randint(2, 30)
    # template: "x - a = b" so x = b + a → pick b, then a, x = b + a (positive)
    b = rng.randint(2, 30)
    return {'a': a, 'b': b}  # x = a + b


def _sample_eq_mul(rng):
    x = rng.randint(2, 12)
    a = rng.randint(2, 12)
    return {'a': a, 'b': a * x}


def _math_gcd(a: int, b: int) -> int:
    from math import gcd
    return gcd(a, b)


def _math_lcm(a: int, b: int) -> int:
    return abs(a * b) // _math_gcd(a, b) if a and b else 0


def _sample_lcm(rng):
    a = rng.randint(2, 24)
    b = rng.randint(2, 24)
    while a == b:
        b = rng.randint(2, 24)
    return {'a': a, 'b': b}


def _sample_hcf(rng):
    # Build numbers with a non-trivial common factor so the HCF answer is
    # interesting (otherwise we get HCF = 1 most of the time).
    k = rng.choice([2, 3, 4, 5, 6, 7, 8])
    m = rng.randint(2, 9)
    n = rng.randint(2, 9)
    while m == n:
        n = rng.randint(2, 9)
    return {'a': k * m, 'b': k * n}


def _fraction_distractors(rng, values, *, count: int = 3) -> list:
    """Plausible wrong fractions sharing the denominator of the correct answer."""
    a, b, d = values['a'], values['b'], values['d']
    correct_num = a + b
    out: list = []
    candidates = [a, b, abs(a - b), correct_num + 1, max(1, correct_num - 1), a * b or 1]
    rng.shuffle(candidates)
    for n in candidates:
        if 0 < n < d * 2 and n != correct_num:
            opt = f'{n}/{d}'
            if opt not in out:
                out.append(opt)
        if len(out) >= count:
            break
    while len(out) < count:
        n = rng.randint(1, d * 2 - 1)
        opt = f'{n}/{d}'
        if n != correct_num and opt not in out:
            out.append(opt)
    return out[:count]


# Extra patterns mounted onto the same registry. They use the flexible
# `sample` / `compute_v` API so templates can take arbitrary placeholders.
_ARITH_PATTERNS.extend([
    # --- fractions ---
    {
        'name': 'fraction_of',
        'regex': re.compile(r'(?i)(?:find\s+)?(\d{1,2})\s*/\s*(\d{1,2})\s+of\s+(\d{1,4})'),
        'sample': _sample_fraction_of,
        'template': 'Find {n}/{d} of {v}.',
        'compute_v': lambda v: (v['n'] * v['v']) // v['d'],
    },
    {
        'name': 'fraction_add_same_denom',
        'regex': re.compile(r'(?i)\badd\s+(\d{1,2})\s*/\s*(\d{1,2})\s+(?:and|to|\+)\s+(\d{1,2})\s*/\s*(\d{1,2})\b'),
        'sample': _sample_fraction_add_same_denom,
        'template': 'Add {a}/{d} and {b}/{d}.',
        'compute_v': lambda v: f"{v['a'] + v['b']}/{v['d']}",
        'answer_type': 'fraction',
    },
    # --- conversions (length / time / mass) ---
    {
        'name': 'm_to_cm',
        'arity': 1,
        'regex': re.compile(r'(?i)\bconvert\s+(\d{1,3})\s*m(?:eters?|etres?)?\s+(?:to|into)\s+cm\b'),
        'template': 'Convert {a} m to cm.',
        'compute': lambda a: a * 100,
        'unit': 'cm',
        'range': (1, 25),
    },
    {
        'name': 'cm_to_mm',
        'arity': 1,
        'regex': re.compile(r'(?i)\bconvert\s+(\d{1,3})\s*cm\s+(?:to|into)\s+mm\b'),
        'template': 'Convert {a} cm to mm.',
        'compute': lambda a: a * 10,
        'unit': 'mm',
        'range': (2, 60),
    },
    {
        'name': 'km_to_m',
        'arity': 1,
        'regex': re.compile(r'(?i)\bconvert\s+(\d{1,3})\s*km\s+(?:to|into)\s+m(?:eters?|etres?)?\b'),
        'template': 'Convert {a} km to m.',
        'compute': lambda a: a * 1000,
        'unit': 'm',
        'range': (1, 15),
    },
    {
        'name': 'hours_to_min',
        'arity': 1,
        'regex': re.compile(r'(?i)\bconvert\s+(\d{1,3})\s*hours?\s+(?:to|into)\s+minutes?\b'),
        'template': 'Convert {a} hours to minutes.',
        'compute': lambda a: a * 60,
        'unit': 'minutes',
        'range': (1, 12),
    },
    {
        'name': 'min_to_sec',
        'arity': 1,
        'regex': re.compile(r'(?i)\bconvert\s+(\d{1,3})\s*minutes?\s+(?:to|into)\s+seconds?\b'),
        'template': 'Convert {a} minutes to seconds.',
        'compute': lambda a: a * 60,
        'unit': 'seconds',
        'range': (1, 15),
    },
    {
        'name': 'kg_to_g',
        'arity': 1,
        'regex': re.compile(r'(?i)\bconvert\s+(\d{1,3})\s*kg\s+(?:to|into)\s+g(?:rams?)?\b'),
        'template': 'Convert {a} kg to grams.',
        'compute': lambda a: a * 1000,
        'unit': 'grams',
        'range': (1, 10),
    },
    # --- money (unit price × quantity) ---
    {
        'name': 'unit_price',
        'regex': re.compile(
            r'(?i)\bif\s+(?:1|one)\s+\w+\s+costs?\s+(?:rs\.?|rupees?|npr)\s*\d+'
            r'.*?(?:cost\s+of|how\s+much)'
        ),
        'sample': _sample_unit_price,
        'template': 'If 1 {item} costs Rs {a}, what is the cost of {b} {items}?',
        'compute_v': lambda v: v['a'] * v['b'],
        'unit': 'Rs',
    },
    # --- comparisons (two-option MCQ) ---
    {
        'name': 'compare_greater',
        'regex': re.compile(r'(?i)\bwhich\s+is\s+(?:greater|bigger|larger)\s*[:?]?\s*(\d{1,5})\s+or\s+(\d{1,5})'),
        'sample': _sample_compare,
        'template': 'Which is greater: {a} or {b}?',
        'compute_v': lambda v: max(v['a'], v['b']),
        'answer_type': 'choice',
    },
    {
        'name': 'compare_smaller',
        'regex': re.compile(r'(?i)\bwhich\s+is\s+(?:smaller|less|lesser)\s*[:?]?\s*(\d{1,5})\s+or\s+(\d{1,5})'),
        'sample': _sample_compare,
        'template': 'Which is smaller: {a} or {b}?',
        'compute_v': lambda v: min(v['a'], v['b']),
        'answer_type': 'choice',
    },
    # --- word problems (story-context arithmetic) ---
    {
        'name': 'wp_add',
        'regex': re.compile(
            r'(?is)\b\w+\s+has\s+\d+\s+\w+\b'
            r'.{0,80}\b\w+\s+has\s+\d+\s+\w+\b'
            r'.{0,60}\b(?:total|altogether|combined|in\s+all|together)\b'
        ),
        'sample': _sample_wp_add,
        'template': '{name1} has {a} {items}. {name2} has {b} {items}. How many {items} do they have altogether?',
        'compute_v': lambda v: v['a'] + v['b'],
    },
    {
        'name': 'wp_sub',
        'regex': re.compile(
            r'(?is)\b\w+\s+has\s+\d+\s+\w+\b'
            r'.{0,80}\b(?:gives?|gave|sold|lost|ate|loses?)\s+\d+\s+\w+\b'
            r'.{0,60}\b(?:left|remaining|now|how\s+many)\b'
        ),
        'sample': _sample_wp_sub,
        'template': '{name1} has {a} {items}. {name1} gives {b} {items} to a friend. How many {items} are left?',
        'compute_v': lambda v: v['a'] - v['b'],
    },
    # --- powers + roots ---
    {
        'name': 'sqrt',
        'arity': 1,
        'regex': re.compile(r'(?i)\b(?:find\s+(?:the\s+)?)?square\s+root\s+of\s+(\d{1,5})\b'),
        'template': 'Find the square root of {a}.',
        'compute': lambda a: int(round(a ** 0.5)),
        'range': (2, 12),
        'constraint': 'perfect_square',
    },
    {
        'name': 'power',
        'regex': re.compile(
            r'(?i)\b(?:find\s+the\s+value\s+of\s+)?(\d{1,3})\s*'
            r'(?:\^|\*\*|to\s+the\s+power\s+(?:of\s+)?|raised\s+to\s+(?:the\s+power\s+)?)\s*(\d{1,2})\b'
        ),
        'sample': _sample_power,
        'template': 'Find the value of {a} to the power of {b}.',
        'compute_v': lambda v: v['a'] ** v['b'],
    },
    # --- simple linear equations ---
    {
        'name': 'eq_add',
        'regex': re.compile(r'(?i)\bif\s+x\s*\+\s*\d{1,3}\s*=\s*\d{1,4}\s*,?\s*(?:find|solve\s+for)?\s*x\b'),
        'sample': _sample_eq_add,
        'template': 'If x + {a} = {b}, find x.',
        'compute_v': lambda v: v['b'] - v['a'],
    },
    {
        'name': 'eq_sub',
        'regex': re.compile(r'(?i)\bif\s+x\s*[-−]\s*\d{1,3}\s*=\s*\d{1,4}\s*,?\s*(?:find|solve\s+for)?\s*x\b'),
        'sample': _sample_eq_sub,
        'template': 'If x − {a} = {b}, find x.',
        'compute_v': lambda v: v['a'] + v['b'],
    },
    {
        'name': 'eq_mul',
        'regex': re.compile(r'(?i)\bif\s+\d{1,3}\s*(?:x|\*\s*x|×\s*x)\s*=\s*\d{1,4}\s*,?\s*(?:find|solve\s+for)?\s*x\b'),
        'sample': _sample_eq_mul,
        'template': 'If {a}x = {b}, find x.',
        'compute_v': lambda v: v['b'] // v['a'],
    },
    # --- number theory ---
    {
        'name': 'lcm',
        'regex': re.compile(
            r'(?i)\b(?:find\s+the\s+)?(?:lcm|l\.c\.m\.?|least\s+common\s+multiple)\s+of\s+\d+\s+and\s+\d+\b'
        ),
        'sample': _sample_lcm,
        'template': 'Find the LCM of {a} and {b}.',
        'compute_v': lambda v: _math_lcm(v['a'], v['b']),
    },
    {
        'name': 'hcf',
        'regex': re.compile(
            r'(?i)\b(?:find\s+the\s+)?(?:hcf|h\.c\.f\.?|gcd|g\.c\.d\.?|highest\s+common\s+factor|greatest\s+common\s+(?:factor|divisor))\s+of\s+\d+\s+and\s+\d+\b'
        ),
        'sample': _sample_hcf,
        'template': 'Find the HCF of {a} and {b}.',
        'compute_v': lambda v: _math_gcd(v['a'], v['b']),
    },
    # --- geometry: cube volume ---
    {
        'name': 'volume_cube',
        'arity': 1,
        'regex': re.compile(r'(?is)\bvolume\s+of\s+(?:a\s+|the\s+)?cube\b.*?side\s*(?:is|=)?\s*(\d{1,3})'),
        'template': 'Find the volume of a cube with side {a} cm.',
        'compute': lambda a: a ** 3,
        'unit': 'cubic cm',
        'range': (2, 15),
    },
])


_CURRENCY_UNITS = {'Rs', 'NPR', '$', '€', '£', '¥'}


def _fmt_number(value, unit=None):
    if isinstance(value, float):
        if abs(value - int(value)) < 1e-9:
            s = str(int(value))
        else:
            s = f'{value:.2f}'.rstrip('0').rstrip('.')
    else:
        s = str(value)
    if not unit:
        return s
    # Currency-style units prefix the value ("Rs 35"); everything else suffixes ("35 cm").
    if unit in _CURRENCY_UNITS:
        return f'{unit} {s}'
    return f'{s} {unit}'


def _numeric_distractors(rng, answer, *, count=3):
    """Return up to `count` plausible-but-wrong numeric distractors near `answer`."""
    seen = {answer}
    out: list = []
    # Convert to int when answer is whole-valued for nicer offsets.
    base = int(answer) if isinstance(answer, (int, float)) and float(answer).is_integer() else answer
    offsets = [1, -1, 2, -2, 3, -3, 5, -5, 10, -10]
    rng.shuffle(offsets)
    candidates: list = []
    for d in offsets:
        candidates.append(base + d)
    if isinstance(base, int) and base >= 4:
        candidates.append(base * 2)
        candidates.append(base // 2)
    # Always positive (these are textbook drills — negative answers look wrong).
    for c in candidates:
        if isinstance(c, (int, float)) and c < 0:
            continue
        if c in seen:
            continue
        seen.add(c)
        out.append(c)
        if len(out) >= count:
            break
    # As a last resort, walk further out so we always return `count` items.
    step = 1
    while len(out) < count:
        for d in (step, -step):
            c = base + d * 7
            if c < 0 or c in seen:
                continue
            seen.add(c)
            out.append(c)
            if len(out) >= count:
                break
        step += 1
        if step > 20:
            break
    return out[:count]


def _sample_numbers_for_pattern(rng, pat):
    """Draw a fresh (a, b[, c]) tuple that satisfies the pattern's constraint."""
    lo, hi = pat.get('range', (2, 50))
    constraint = pat.get('constraint')
    if pat['arity'] == 1:
        if constraint == 'perfect_square':
            # `range` here is the range of the *root*; the prompt receives root²
            # so the square-root answer is a clean integer.
            root = rng.randint(lo, hi)
            return (root * root,)
        return (rng.randint(lo, hi),)
    if pat['arity'] == 2:
        if constraint == 'a_lt_b':
            a = rng.randint(lo, max(lo, hi - 2))
            b = rng.randint(a + 2, hi + 10)
            return (a, b)
        if constraint == 'a_ge_b':
            a = rng.randint(lo, hi)
            b = rng.randint(max(2, lo), max(2, a - 1) if a > 2 else 2)
            return (a, b)
        if constraint == 'b_divides_a':
            b = rng.randint(2, 12)
            mult = rng.randint(2, 12)
            return (b * mult, b)
        if constraint == 'percent_clean':
            # (a * b) must be divisible by 100, so the answer is a clean integer.
            for _ in range(30):
                a = rng.choice([5, 10, 20, 25, 40, 50, 60, 75, 80])
                b = rng.choice([20, 40, 50, 80, 100, 120, 160, 200, 250, 400, 500])
                if (a * b) % 100 == 0:
                    return (a, b)
            return (25, 200)
        return (rng.randint(lo, hi), rng.randint(lo, hi))
    if pat['arity'] == 3:
        # avg_clean: sum divisible by 3 so the average is a whole number.
        if constraint == 'avg_clean':
            for _ in range(40):
                a, b, c = rng.randint(lo, hi), rng.randint(lo, hi), rng.randint(lo, hi)
                if (a + b + c) % 3 == 0:
                    return (a, b, c)
            return (3, 6, 9)
        return (rng.randint(lo, hi), rng.randint(lo, hi), rng.randint(lo, hi))
    return ()


def _arith_variants_for_text(body: str, *, n_variants: int, rng) -> list[dict]:
    """Scan `body` for worked-example phrasings and emit MCQ variants with
    new numbers + recomputed answers.

    Each entry in `_ARITH_PATTERNS` uses one of two interfaces:
      • legacy:  `arity` + tuple-based `compute(*nums)` (sum, product, area, …)
      • flexible: `sample(rng) -> dict` + `compute_v(values) -> answer`
                  (fractions, conversions, money, comparisons, word problems)
    The flexible path lets templates take arbitrary named placeholders such as
    `{item}` or `{name1}` so we can build readable story-context problems.
    """
    out: list[dict] = []
    seen_prompts: set = set()
    for pat in _ARITH_PATTERNS:
        if not pat['regex'].search(body):
            continue
        m = pat['regex'].search(body)
        unit = pat.get('unit')
        answer_type = pat.get('answer_type', 'number')
        sample_fn = pat.get('sample')

        for _ in range(n_variants):
            values = None
            if sample_fn:
                try:
                    values = sample_fn(rng)
                except Exception:
                    values = None
                if not values:
                    continue
                try:
                    answer = pat['compute_v'](values)
                except Exception:
                    continue
                try:
                    prompt = pat['template'].format(**values)
                except Exception:
                    continue
            else:
                nums = _sample_numbers_for_pattern(rng, pat)
                if not nums:
                    continue
                try:
                    answer = pat['compute'](*nums)
                except Exception:
                    continue
                if pat['arity'] == 1:
                    prompt = pat['template'].format(a=nums[0])
                elif pat['arity'] == 2:
                    prompt = pat['template'].format(a=nums[0], b=nums[1])
                else:
                    prompt = pat['template'].format(a=nums[0], b=nums[1], c=nums[2])

            key = prompt.lower()
            if key in seen_prompts:
                continue
            seen_prompts.add(key)

            # Build options + final answer string per answer type.
            if answer_type == 'fraction':
                ans_str = answer if isinstance(answer, str) else _fmt_number(answer, unit)
                options = [ans_str] + (_fraction_distractors(rng, values, count=3) if values else [])
            elif answer_type == 'choice':
                # Two-option MCQ: the two candidates are the only options.
                choices = list((values or {}).get('_choices') or [])
                if len(choices) < 2:
                    continue
                ans_str = str(answer)
                options = choices
            else:
                ans_str = _fmt_number(answer, unit)
                distractors = _numeric_distractors(rng, answer, count=3)
                options = [ans_str] + [_fmt_number(d, unit) for d in distractors]

            if not options or ans_str not in options:
                # Safety: skip malformed variants.
                continue
            rng.shuffle(options)
            out.append({
                'type': 'mcq',
                'kind': f'arith_{pat["name"]}',
                'prompt': prompt,
                'options': options,
                'answer': ans_str,
                'variant_of': m.group(0).strip(),
            })
    return out


# Templates a sentence-style question by stripping the keyword from the cloze.
def _text_variants_for_block(body: str, *, keywords, rng, max_items: int = 4) -> list[dict]:
    """Cloze + true/false variants mined from the activity body itself."""
    out: list[dict] = []
    if not body:
        return out
    sents = [s for s in split_sentences(body) if 25 <= len(s) <= 220]
    if not sents:
        return out

    rng.shuffle(sents)
    used_keywords: set = set()

    # 1) Cloze variants — pick a keyword that appears in the sentence and mask it.
    kw_lower = [(k, (k or '').strip().lower()) for k in (keywords or []) if (k or '').strip()]
    for sent in sents:
        if len(out) >= max_items:
            break
        sl = sent.lower()
        candidate = None
        for kw, klow in kw_lower:
            if 3 <= len(kw) <= 24 and klow in sl and klow not in used_keywords:
                candidate = kw
                break
        if not candidate:
            continue
        masked = make_cloze(sent, candidate)
        if not masked or '____' not in masked:
            continue
        used_keywords.add(candidate.lower())
        # MCQ option pool from other chapter keywords.
        pool = [k for k, _ in kw_lower if k.lower() != candidate.lower()]
        rng.shuffle(pool)
        distractors = pool[:3]
        if len(distractors) >= 3:
            options = [candidate] + distractors
            rng.shuffle(options)
            out.append({
                'type': 'mcq',
                'kind': 'cloze',
                'prompt': f'Fill in the blank: "{masked}"',
                'options': options,
                'answer': candidate,
            })
        else:
            out.append({
                'type': 'cloze',
                'kind': 'cloze',
                'prompt': f'Fill in the blank: "{masked}"',
                'options': None,
                'answer': candidate,
            })

    # 2) True/false variants — half kept as-is (True), half lightly mutated (False).
    # Skip imperative / instructional sentences ("Find the sum of 23 and 45.",
    # "Convert 5 m to cm.") because phrasing them as "True or False" reads as
    # nonsense — they are tasks, not assertions.
    _imperative_starts = (
        'find ', 'compute ', 'calculate ', 'convert ', 'add ', 'subtract ',
        'multiply ', 'divide ', 'simplify ', 'evaluate ', 'solve ',
        'draw ', 'write ', 'name ', 'list ', 'show ', 'fill ', 'complete ',
        'arrange ', 'sort ', 'measure ', 'estimate ', 'identify ', 'classify ',
        'circle ', 'underline ', 'match ', 'choose ', 'select ', 'check ',
    )
    # Sentences embedded in a word problem (story-context like "Ram has 12
    # marbles") aren't standalone assertions — mutating their numbers gives a
    # scenario, not a factual falsehood. Drop them too.
    _story_context_re = re.compile(
        r'(?i)\b\w+\s+(?:has|have|gives?|gave|gets?|got|took|takes?|sold|sells?|bought|buys?|costs?|earns?|spends?|ate|eats?|loses?|lost)\s+\d+'
    )
    for sent in sents:
        if len(out) >= max_items:
            break
        s = sent.strip().rstrip('.')
        if not s:
            continue
        # Drop second-person imperatives and direct questions — they don't
        # behave as true/false statements.
        sl = s.lower()
        if sl.endswith('?'):
            continue
        if any(sl.startswith(p) for p in _imperative_starts):
            continue
        if _story_context_re.search(s):
            continue
        flip = rng.random() < 0.5
        if flip:
            mutated = _mutate_sentence_for_false(s, rng)
            if not mutated or mutated == s:
                continue
            out.append({
                'type': 'mcq',
                'kind': 'true_false',
                'prompt': f'True or False: "{mutated}."',
                'options': ['True', 'False'],
                'answer': 'False',
            })
        else:
            out.append({
                'type': 'mcq',
                'kind': 'true_false',
                'prompt': f'True or False: "{s}."',
                'options': ['True', 'False'],
                'answer': 'True',
            })

    return out


_NUM_TOKEN_RE = re.compile(r'(?<!\d)(\d{1,4})(?!\d)')
_ANTONYMS = [
    ('always', 'never'), ('all', 'no'), ('every', 'no'),
    ('increase', 'decrease'), ('increases', 'decreases'),
    ('rises', 'falls'), ('rise', 'fall'),
    ('more', 'less'), ('greater', 'smaller'),
    ('hotter', 'colder'), ('higher', 'lower'),
    ('above', 'below'), ('before', 'after'),
    ('large', 'small'), ('larger', 'smaller'),
]


def _mutate_sentence_for_false(sent: str, rng) -> str:
    """Produce a falsified version of `sent` by swapping a number or antonym."""
    # Try a number swap first — that gives the cleanest "false" version.
    nums = _NUM_TOKEN_RE.findall(sent)
    if nums:
        original = rng.choice(nums)
        try:
            n = int(original)
        except Exception:
            n = None
        if n is not None:
            delta = rng.choice([3, 5, 7, 10, -3, -5, -7])
            replacement = max(0, n + delta)
            if replacement != n:
                return _NUM_TOKEN_RE.sub(
                    lambda m, _t=original, _r=str(replacement): _r if m.group(1) == _t else m.group(1),
                    sent, count=1,
                )

    # Otherwise look for a swappable antonym.
    for a, b in _ANTONYMS:
        pat = re.compile(rf'\b{re.escape(a)}\b', re.IGNORECASE)
        if pat.search(sent):
            return pat.sub(b, sent, count=1)
        patb = re.compile(rf'\b{re.escape(b)}\b', re.IGNORECASE)
        if patb.search(sent):
            return patb.sub(a, sent, count=1)
    return ''


def generate_activity_variants(
    block,
    *,
    n_variants: int = 3,
    seed: int = 0,
    keywords=None,
    dict_entries=None,
    subject_kind: str | None = None,
):
    """
    Build practice variants from a single textbook Activity / Exercise block.

    `subject_kind`:
      • 'quantitative' — Maths / Science / Computer etc. We emit ONLY
        worked-example numeric variants (sum, fraction_of, conversion,
        equation, LCM…). No cloze, no true/false, no dictionary "What is X?"
        — otherwise a Maths exam reads like a grammar quiz built from the
        chapter prose.
      • 'narrative'   — English / Social Studies / History etc. We add cloze
        + true/false derived from sentences AND a dictionary-driven "What is
        X?" item when the title surfaces a known keyword.
      • None          — backwards-compatible mixed mode (numeric + narrative).
    """
    if not isinstance(block, dict):
        return []
    body = (block.get('body') or '').strip()
    title = (block.get('title') or '').strip()
    if not body and not title:
        return []
    rng = random.Random(seed)
    keywords = list(keywords or [])
    dict_entries = dict_entries or {}
    is_quant = (subject_kind == 'quantitative')

    pool: list[dict] = []

    # 1) Numeric / arithmetic variants. For quantitative subjects we ask for
    #    a bigger numeric pool since that is the only source we will sample
    #    from (the narrative paths are skipped below).
    arith_n = n_variants * 3 if is_quant else n_variants
    pool.extend(_arith_variants_for_text(body, n_variants=arith_n, rng=rng))

    if is_quant:
        # For Maths/Science the narrative paths (cloze, T/F, definition) are
        # disabled. Return early with only the worked-example variants — the
        # final dedupe/trim logic below still caps the output at n_variants.
        return _trim_pool(rng, pool, n_variants)

    # 2) Cloze + true/false variants from the block sentences.
    pool.extend(
        _text_variants_for_block(
            body,
            keywords=keywords,
            rng=rng,
            max_items=n_variants,
        )
    )

    # 3) Title-driven definition question — when we have a dictionary entry
    #    for a keyword that appears in the title, surface it as a "What is X?".
    if title and dict_entries and keywords:
        title_low = title.lower()
        for kw in keywords:
            klow = (kw or '').strip().lower()
            if not klow or klow not in title_low:
                continue
            entry = dict_entries.get(kw) or dict_entries.get(klow) or {}
            defn = ''
            if isinstance(entry, dict):
                defn = (entry.get('def') or '').strip()
            if not defn or len(defn) < 12:
                continue
            # Distractors: other dictionary defs from the same dict_entries map.
            other_defs = []
            for other_kw, other_entry in dict_entries.items():
                if other_kw.lower() == klow:
                    continue
                d = (other_entry.get('def') or '').strip() if isinstance(other_entry, dict) else ''
                if d and len(d) >= 12 and d.lower() != defn.lower():
                    other_defs.append(d)
            rng.shuffle(other_defs)
            if len(other_defs) < 3:
                break
            options = [defn] + other_defs[:3]
            rng.shuffle(options)
            pool.append({
                'type': 'mcq',
                'kind': 'what',
                'prompt': f'What is the meaning of "{kw}"?',
                'options': options,
                'answer': defn,
            })
            break

    return _trim_pool(rng, pool, n_variants)


def _trim_pool(rng, pool: list[dict], n_variants: int) -> list[dict]:
    """Cap `pool` to `n_variants` items while preferring a mix of kinds."""
    if len(pool) <= n_variants:
        return pool
    rng.shuffle(pool)
    picked: list[dict] = []
    seen_kinds: dict[str, int] = {}
    cap = max(1, (n_variants + 1) // 2)
    for q in pool:
        kind = q.get('kind') or 'mixed'
        if seen_kinds.get(kind, 0) >= cap:
            continue
        picked.append(q)
        seen_kinds[kind] = seen_kinds.get(kind, 0) + 1
        if len(picked) >= n_variants:
            break
    if len(picked) < n_variants:
        # Backfill ignoring the kind cap so we always hit the target if possible.
        for q in pool:
            if q in picked:
                continue
            picked.append(q)
            if len(picked) >= n_variants:
                break
    return picked


def upsert_generated_content(conn, row):
    conn.execute(
        """
        INSERT INTO generated_content (
          id, content_type, title, body, subject, grade_level, chapter_id,
          source_chunk_ids_json, generator_model, prompt_version, status,
          approved_by_teacher, teacher_feedback, quality_score, created_at, zvec_doc_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title=excluded.title,
          body=excluded.body,
          subject=excluded.subject,
          grade_level=excluded.grade_level,
          chapter_id=excluded.chapter_id,
          source_chunk_ids_json=excluded.source_chunk_ids_json,
          generator_model=excluded.generator_model,
          prompt_version=excluded.prompt_version,
          status=excluded.status,
          zvec_doc_id=excluded.zvec_doc_id
        """,
        (
            row['id'],
            row['content_type'],
            row.get('title'),
            row['body'],
            row.get('subject'),
            row.get('grade_level'),
            row.get('chapter_id'),
            json.dumps(row.get('source_chunk_ids', []), ensure_ascii=False),
            row.get('generator_model'),
            row.get('prompt_version'),
            row.get('status', 'generated'),
            int(row.get('approved_by_teacher', 0)),
            row.get('teacher_feedback'),
            row.get('quality_score'),
            row.get('created_at', now_iso()),
            row.get('zvec_doc_id'),
        ),
    )


def upsert_exercise(conn, row):
    conn.execute(
        """
        INSERT INTO exercises (
          id, chapter_id, subject, grade_level, question_text, question_type,
          difficulty, answer_options_json, correct_answer, solution_text, hint,
          skills_json, learning_objectives_json, source_type, source_ref, zvec_doc_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          question_text=excluded.question_text,
          question_type=excluded.question_type,
          difficulty=excluded.difficulty,
          answer_options_json=excluded.answer_options_json,
          correct_answer=excluded.correct_answer,
          solution_text=excluded.solution_text,
          hint=excluded.hint,
          source_ref=excluded.source_ref,
          zvec_doc_id=excluded.zvec_doc_id
        """,
        (
            row['id'],
            row.get('chapter_id'),
            row.get('subject'),
            row.get('grade_level'),
            row['question_text'],
            row.get('question_type'),
            row.get('difficulty'),
            json.dumps(row.get('answer_options', []), ensure_ascii=False),
            row.get('correct_answer'),
            row.get('solution_text'),
            row.get('hint'),
            json.dumps(row.get('skills', []), ensure_ascii=False),
            json.dumps(row.get('learning_objectives', []), ensure_ascii=False),
            row.get('source_type', 'generated'),
            row.get('source_ref', 'generate_assets_v1'),
            row.get('zvec_doc_id'),
        ),
    )


def get_chapters(conn, *, subject=None, grade_level=None, language=None, limit=0):
    sql = """
        SELECT ch.id AS chapter_id, ch.chapter_title, ch.subject, ch.grade_level, d.language
        FROM chapters ch
        JOIN documents d ON d.id = ch.document_id
        WHERE (? IS NULL OR ch.subject = ?)
          AND (? IS NULL OR ch.grade_level = ?)
          AND (? IS NULL OR d.language = ?)
        ORDER BY ch.grade_level, ch.subject, ch.sequence_order
    """

    params = (subject, subject, grade_level, grade_level, language, language)
    rows = conn.execute(sql, params).fetchall()
    out = [dict(r) for r in rows]
    if limit and limit > 0:
        return out[:limit]
    return out


def get_chunks_for_chapter(conn, chapter_id: str):
    rows = conn.execute(
        """
        SELECT id, clean_text
        FROM chunks
        WHERE chapter_id = ?
        ORDER BY page_start, chunk_index
        """,
        (chapter_id,),
    ).fetchall()

    chunk_ids = []
    chunks_text = []
    for r in rows:
        chunk_ids.append(r['id'])
        chunks_text.append(r['clean_text'] or '')

    chunks_text = [t for t in chunks_text if t.strip()]
    return chunk_ids, chunks_text


def insert_zvec_doc(collection, doc_id: str, vector):
    try:
        import zvec  # noqa: WPS433
        collection.insert([zvec.Doc(id=doc_id, vectors={'embedding': vector})])
    except Exception:
        pass


def build_arg_parser():
    p = argparse.ArgumentParser(description='Generate chapter assets (keywords, summaries, quizzes, flashcards)')
    p.add_argument('--subject', default=None)
    p.add_argument('--grade', type=int, default=None)
    p.add_argument('--language', default=None)
    p.add_argument('--limit-chapters', type=int, default=0)
    p.add_argument('--quiz-questions', type=int, default=10)
    p.add_argument('--seed', type=int, default=0)
    p.add_argument('--final-exam', action='store_true', help='Also build a final exam (aggregated)')
    p.add_argument('--final-exam-questions', type=int, default=40)
    return p


def main():
    args = build_arg_parser().parse_args()

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Optional: embed generated assets into zvec (may be unavailable on older CPUs / slim images).
    model = None
    exercise_bank = None
    generated_assets = None
    try:
        from app.embed.model import load_model  # noqa: WPS433
        from app.index.zvec_store import open_exercise_bank, open_generated_assets  # noqa: WPS433

        model = load_model()
        exercise_bank = open_exercise_bank()
        generated_assets = open_generated_assets()
    except Exception:
        model = None

    chapters = get_chapters(
        conn,
        subject=args.subject,
        grade_level=args.grade,
        language=args.language,
        limit=args.limit_chapters,
    )

    if not chapters:
        raise SystemExit('No chapters found (did you ingest content first?).')

    for ch in chapters:
        chapter_id = ch['chapter_id']
        chunk_ids, chunks_text = get_chunks_for_chapter(conn, chapter_id)
        if not chunks_text:
            continue

        keywords = compute_keywords(chunks_text, limit=12)
        summary = summarize(chunks_text, sentence_limit=6)
        flashcards = generate_flashcards(chunks_text, keywords, limit=12)
        quiz = generate_quiz(chunks_text, keywords, n_questions=args.quiz_questions, seed=args.seed)

        # Store generated assets
        kw_id = stable_id('gen_kw', chapter_id, 'v1')
        kw_body = json.dumps({'keywords': keywords}, ensure_ascii=False)
        upsert_generated_content(
            conn,
            {
                'id': kw_id,
                'content_type': 'chapter_keywords',
                'title': f"Keywords: {ch['chapter_title']}",
                'body': kw_body,
                'subject': ch.get('subject'),
                'grade_level': ch.get('grade_level'),
                'chapter_id': chapter_id,
                'source_chunk_ids': chunk_ids,
                'generator_model': 'tfidf',
                'prompt_version': 'v1',
                'status': 'generated',
                'zvec_doc_id': kw_id,
            },
        )

        sum_id = stable_id('gen_sum', chapter_id, 'v1')
        sum_body = json.dumps({'summary': summary}, ensure_ascii=False)
        upsert_generated_content(
            conn,
            {
                'id': sum_id,
                'content_type': 'chapter_summary',
                'title': f"Summary: {ch['chapter_title']}",
                'body': sum_body,
                'subject': ch.get('subject'),
                'grade_level': ch.get('grade_level'),
                'chapter_id': chapter_id,
                'source_chunk_ids': chunk_ids,
                'generator_model': 'extractive_tfidf',
                'prompt_version': 'v1',
                'status': 'generated',
                'zvec_doc_id': sum_id,
            },
        )

        fc_id = stable_id('gen_fc', chapter_id, 'v1')
        fc_body = json.dumps({'flashcards': flashcards}, ensure_ascii=False)
        upsert_generated_content(
            conn,
            {
                'id': fc_id,
                'content_type': 'flashcards',
                'title': f"Flashcards: {ch['chapter_title']}",
                'body': fc_body,
                'subject': ch.get('subject'),
                'grade_level': ch.get('grade_level'),
                'chapter_id': chapter_id,
                'source_chunk_ids': chunk_ids,
                'generator_model': 'heuristic',
                'prompt_version': 'v1',
                'status': 'generated',
                'zvec_doc_id': fc_id,
            },
        )

        quiz_id = stable_id('gen_quiz', chapter_id, 'v1', str(args.quiz_questions))
        quiz_body = json.dumps({'questions': quiz}, ensure_ascii=False)
        upsert_generated_content(
            conn,
            {
                'id': quiz_id,
                'content_type': 'chapter_quiz',
                'title': f"Quiz: {ch['chapter_title']}",
                'body': quiz_body,
                'subject': ch.get('subject'),
                'grade_level': ch.get('grade_level'),
                'chapter_id': chapter_id,
                'source_chunk_ids': chunk_ids,
                'generator_model': 'heuristic',
                'prompt_version': 'v1',
                'status': 'generated',
                'zvec_doc_id': quiz_id,
            },
        )

        # ZVEC for generated assets
        if model is not None and generated_assets is not None:
            for gen_id, text in [
                (kw_id, ' '.join(keywords)),
                (sum_id, summary),
                (fc_id, ' '.join(c['front'] + ' ' + c['back'] for c in flashcards[:5])),
                (quiz_id, ' '.join(q.get('prompt', '') for q in quiz)),
            ]:
                if not text.strip():
                    continue
                vec = model.encode([text], normalize_embeddings=True)[0].tolist()
                insert_zvec_doc(generated_assets, gen_id, vec)

        # Exercises (one row per quiz question)
        for i, q in enumerate(quiz, start=1):
            qtype = q.get('type')
            prompt = q.get('prompt', '').strip()
            answer = q.get('answer')
            options = q.get('options', []) if qtype == 'mcq' else []
            if not prompt or not answer:
                continue

            ex_id = stable_id('ex', chapter_id, 'v1', qtype or 'unknown', str(i), prompt)
            ex_row = {
                'id': ex_id,
                'chapter_id': chapter_id,
                'subject': ch.get('subject'),
                'grade_level': ch.get('grade_level'),
                'question_text': prompt,
                'question_type': qtype,
                'difficulty': None,
                'answer_options': options,
                'correct_answer': answer,
                'solution_text': None,
                'hint': None,
                'skills': [],
                'learning_objectives': [],
                'source_type': 'generated',
                'source_ref': 'generate_assets_v1',
                'zvec_doc_id': ex_id,
            }
            upsert_exercise(conn, ex_row)

            ex_text = prompt + ('\n' + '\n'.join(options) if options else '')
            if model is not None and exercise_bank is not None:
                vec = model.encode([ex_text], normalize_embeddings=True)[0].tolist()
                insert_zvec_doc(exercise_bank, ex_id, vec)


    if args.final_exam:
        effective_exam_questions = max(args.final_exam_questions, len(chapters))
        rows = conn.execute(
            """
            SELECT
              e.question_text,
              e.question_type,
              e.answer_options_json,
              e.correct_answer,
              ch.id AS chapter_id,
              ch.chapter_title
            FROM exercises e
            JOIN chapters ch ON ch.id = e.chapter_id
            JOIN documents d ON d.id = ch.document_id
            WHERE e.source_ref = 'generate_assets_v1'
              AND (? IS NULL OR ch.subject = ?)
              AND (? IS NULL OR ch.grade_level = ?)
              AND (? IS NULL OR d.language = ?)
            ORDER BY ch.grade_level, ch.subject, ch.sequence_order
            """,
            (
                args.subject,
                args.subject,
                args.grade,
                args.grade,
                args.language,
                args.language,
            ),
        ).fetchall()

        by_chapter = {}
        for r in rows:
            by_chapter.setdefault(r['chapter_id'], []).append(r)

        chapter_ids = [ch['chapter_id'] for ch in chapters if ch.get('chapter_id')]
        rnd = random.Random(args.seed)
        rnd.shuffle(chapter_ids)

        def row_to_question(ex):
            opts = json.loads(ex['answer_options_json'] or '[]')
            return {
                'type': ex['question_type'],
                'prompt': ex['question_text'],
                'options': opts if opts else None,
                'answer': ex['correct_answer'],
                'chapter_id': ex['chapter_id'],
                'chapter_title': ex['chapter_title'],
            }

        def fallback_question(ch):
            chapter_id = ch['chapter_id']
            _, chapter_chunks = get_chunks_for_chapter(conn, chapter_id)
            title = ch.get('chapter_title') or chapter_id
            try:
                kws = compute_keywords(chapter_chunks, limit=10)
                qs = generate_quiz_v2(
                    chapter_chunks,
                    kws or [],
                    n_questions=1,
                    seed=(args.seed + (hash(chapter_id) & 0x7fffffff)),
                )
                if qs:
                    q = qs[0]
                    q['chapter_id'] = chapter_id
                    q['chapter_title'] = title
                    return q
            except Exception:
                pass
            return {
                'type': 'short_answer',
                'prompt': f'Explain one important idea from the chapter "{title}".',
                'options': None,
                'answer': '',
                'chapter_id': chapter_id,
                'chapter_title': title,
            }

        chapter_by_id = {ch['chapter_id']: ch for ch in chapters if ch.get('chapter_id')}
        picked = []
        # First pass: one question per chapter, so a yearly/grade exam always
        # covers the whole subject syllabus before adding extra questions.
        for cid in chapter_ids:
            pool = by_chapter.get(cid) or []
            if pool:
                picked.append(row_to_question(pool.pop(0)))
            elif cid in chapter_by_id:
                picked.append(fallback_question(chapter_by_id[cid]))

        chapter_ids = [cid for cid in chapter_ids if by_chapter.get(cid)]
        while chapter_ids and len(picked) < effective_exam_questions:
            next_round = []
            for cid in chapter_ids:
                pool = by_chapter.get(cid) or []
                if not pool:
                    continue
                ex = pool.pop(0)
                picked.append(row_to_question(ex))
                if len(picked) >= effective_exam_questions:
                    break
                if pool:
                    next_round.append(cid)
            chapter_ids = next_round

        exam_id = stable_id(
            'gen_exam',
            str(args.subject or ''),
            str(args.grade or ''),
            str(args.language or ''),
            'v1',
            str(effective_exam_questions),
        )
        exam_body = json.dumps({'questions': picked}, ensure_ascii=False)
        upsert_generated_content(
            conn,
            {
                'id': exam_id,
                'content_type': 'final_exam',
                'title': 'Final Exam',
                'body': exam_body,
                'subject': args.subject,
                'grade_level': args.grade,
                'chapter_id': None,
                'source_chunk_ids': [],
                'generator_model': 'heuristic',
                'prompt_version': 'v1',
                'status': 'generated',
                'zvec_doc_id': exam_id,
            },
        )

        exam_text = ' '.join(q.get('prompt', '') for q in picked)
        if exam_text.strip() and model is not None and generated_assets is not None:
            vec = model.encode([exam_text], normalize_embeddings=True)[0].tolist()
            insert_zvec_doc(generated_assets, exam_id, vec)

    conn.commit()
    conn.close()

    print('Generated assets complete.')


if __name__ == '__main__':
    main()
