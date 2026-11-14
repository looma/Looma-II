"""Grounded answers for the Looma assistant.

Pipeline (called by looma_server.py /rag_query):

  1. select_evidence()  pick the few sentences, out of the retrieved chunks,
                        that actually bear on the question (keeps the LLM
                        prompt short: prompt processing is the slow part on
                        the ODROID).
  2. generate()         ask the local LLM (llama.cpp server, looma-llm) to
                        answer ONLY from those numbered sources, or say
                        NOT_FOUND.
  3. verify()           reject any answer that says something the sources do
                        not: every number and proper noun must occur in the
                        sources, and nearly all content words must too.
  4. fallback           if the LLM is unavailable, says NOT_FOUND, or fails
                        verification, return the best source sentence
                        verbatim, labelled as such.
  5. open_answer()      still nothing (and no dictionary entry): the LLM
                        writes the answer from the best retrieved passages of
                        any Looma content, completing it with what it knows.
                        Unverified, so labelled answer_source 'llm_open'.
                        LOOMA_RAG_OPEN_ANSWER=0 turns it off.

Nepali questions are answered extractively (step 4 only): the small models that
run on the box write unreliable Nepali, and an unreliable answer is worse than a
quoted textbook sentence.
"""

from __future__ import annotations

import json
import os
import re
import time
import urllib.request

LLM_URL = (os.environ.get('LOOMA_LLM_URL') or 'http://127.0.0.1:8091').rstrip('/')
LLM_TIMEOUT = float(os.environ.get('LOOMA_LLM_TIMEOUT') or 45)
QUOTE_AFTER_NOT_FOUND = (os.environ.get('LOOMA_RAG_QUOTE_AFTER_NOT_FOUND') or '0') != '0'
LLM_MAX_TOKENS = int(os.environ.get('LOOMA_LLM_MAX_TOKENS') or 90)
LLM_ENABLED = (os.environ.get('LOOMA_LLM') or '1').strip().lower() not in {'0', 'false', 'no', 'off'}

# Sentences re-ranked by meaning with the embedding model, per question. On the
# ODROID each sentence costs ~0.5 s, so this is small (0 disables it).
SENTENCE_POOL = int(os.environ.get('LOOMA_RAG_SENTENCE_POOL') or 0)

MAX_SOURCES = 3
# Characters per source given to the LLM. Prompt processing is the slow part on
# the ODROID (~50 tokens/s): three sources of 420 characters cost ~6 s.
MAX_SOURCE_CHARS = int(os.environ.get('LOOMA_RAG_SOURCE_CHARS') or 420)

NOT_FOUND = 'NOT_FOUND'

_DEVANAGARI = re.compile(r'[ऀ-ॿ]')
_SENT_SPLIT_EN = re.compile(r'(?<=[.!?।|])\s+|\n{2,}')
# Nepali ends sentences with । or |; its "." is an abbreviation (वि.सं.).
_SENT_SPLIT_NE = re.compile(r'(?<=[।|!?])\s+|\n{2,}')


class _Splitter:
    """Picks the sentence splitter by script, so Nepali abbreviations survive."""
    def split(self, text):
        return (_SENT_SPLIT_NE if mostly_nepali(text) else _SENT_SPLIT_EN).split(text or '')


_SENT_SPLIT = _Splitter()
_WORD = re.compile(r"[A-Za-zÀ-ɏ\u0900-\u0963\u0966-\u097f][\w\u0900-\u0963\u0966-\u097f'\-]*|\d+(?:[.,]\d+)*")  # not the danda ।
_NUM = re.compile(r'\d+(?:[.,]\d+)*')
_CITE = re.compile(r'\[(\d+)\]')

STOPWORDS = _STOP = set(
    """a an the of to in on at for from by with and or but if then than as is are was were be been being
    do does did done has have had having it its this that these those there their they them he she his her
    him we our you your i me my what which who whom whose when where why how not no yes can could would
    should will shall may might must about into over under after before during between also so such very
    more most some any each other only own same too just one two also called known used use uses using
    according source sources answer question many much tell explain describe give name happen happened""".split()
) | set("के हो हुन् छ छन् को का की मा ले लाई र पनि यो त्यो भनेको कहाँ कहिले किन कसरी कसले कुन कति हुन्छ गर्ने थियो थिए भएको गरेको तथा वा".split())

WH_HINT = {
    'who': 'Answer with the name.',
    'what': 'Say what it is.',
    'define': 'Give the definition.',
    'when': 'Give the exact date or year for this event.',
    'where': 'Name the place.',
    'why': 'Give the reason.',
    'how': 'Explain how, in one or two steps.',
    'which': 'Name the item.',
}


def is_nepali(text: str) -> bool:
    return bool(_DEVANAGARI.search(text or ''))


def mostly_nepali(text: str) -> bool:
    """Nepali text, not English text that quotes a Nepali name ("Mount
    Everest (Nepali: सगरमाथा) is ...")."""
    t = (text or '')[:400]
    ne = len(_DEVANAGARI.findall(t))
    latin = len(re.findall(r'[A-Za-z]', t))
    return ne > 0 and ne >= latin


def classify_wh(question: str) -> str:
    q = (question or '').strip().lower()
    if is_nepali(q):
        q = ' ' + q
        for k, ws in (('when', ('कहिले',)), ('where', ('कहाँ',)), ('why', ('किन',)), ('how', ('कसरी',)),
                      ('who', (' को हुन्', ' को हो', ' को थिए', ' को थियो', 'कसले', 'कसको'))):
            if any(w in q for w in ws):
                return k
        return 'what'
    if re.match(r'^\s*what\s+(causes|caused|is the cause of|are the causes of|makes)\b', q):
        return 'why'
    for k in ('who', 'when', 'where', 'why', 'how', 'which'):
        if re.search(rf'\b{k}\b', q):
            return k
    if re.search(r'\b(define|meaning of|definition)\b', q):
        return 'define'
    if re.search(r'\bwhat\b', q):
        return 'what'
    return 'what'


def _terms(text: str) -> list[str]:
    return [w.lower() for w in _WORD.findall(text or '')]


def _content(text: str) -> set[str]:
    return {w for w in _terms(text) if len(w) >= 3 and w not in _STOP}


_SUFFIX = re.compile(r'(ing|ed|es|s)$')


_NE_SUFFIX = re.compile(r'(हरूको|हरूमा|हरूले|हरू|को|का|की|मा|ले|लाई|बाट|सँग|देखि|सम्म)$')


def _stem(w: str) -> str:
    """Crude stem. English: drop a plural/tense suffix, keep 5 characters.
    Nepali: drop the postposition glued to the noun (नेपालको -> नेपाल)."""
    if w.isdigit():
        return w
    if not w.isascii():
        return _NE_SUFFIX.sub('', w) if len(w) > 3 else w
    if len(w) > 4:
        w = _SUFFIX.sub('', w)
    # British and American spellings: metre/meter, centre/center, colour/color.
    w = re.sub(r'([^aeiou])re$', r'\1er', w)
    w = re.sub(r'our$', 'or', w) if len(w) > 4 else w
    return w[:5]


_TEACHER_LEADIN = re.compile(r'^(?:\(?[a-h]\)?[.)]\s+)?(?:explain|tell (?:them|the students|students)|remind (?:them|the students|students)|'
                             r'make (?:them|students) (?:understand|clear))\s+that\s+', re.I)


# Quote marks around words ("Tell them that „verb‟ is an action word"); an
# apostrophe inside a word (don't) stays.
_QUOTES = re.compile(r'[„‟“”"]|(?<!\w)[‘\']|[’\'](?!\w)')


def _clean_sentence(s: str) -> str:
    s = re.sub(r'\s+', ' ', s or '')
    s = _QUOTES.sub('', re.sub(r"\s+(['’])s\b", r"\1s", s)).strip()        # "Earth 's" -> "Earth's"
    # Page furniture before the sentence: running heads ("78 Water Resource
    # Engineering: Grade 10 ..."), section numbers ("3.19 Those animals ..."),
    # labels ("Location: Chitwan ..."), dandas.
    s = re.sub(r'^\d{1,3}\s+[A-Z][\w ,&\-]{2,60}:\s*Grade\s*\d+\s+', '', s)
    s = re.sub(r'^\d{1,2}(?:\.\d{1,2})+\s+(?=[A-Z])', '', s)
    s = re.sub(r'^[A-Z][a-z]{2,15}:\s+(?=[A-Z])', '', s)
    s = re.sub(r'^[॥।|]+\s*', '', s)
    # Teacher guides state facts as instructions: "b. Explain that nouns are
    # words that name people ..." -> "nouns are words that name people ...".
    m = _TEACHER_LEADIN.match(s)
    if m:
        s = s[m.end():]
        s = s[:1].upper() + s[1:]
    # Dialogue labels in Nepali lessons: "सुरुचि: लोकतन्त्र भनेको ...".
    s = re.sub(r'^[\u0900-\u097f]{2,14}\s*:\s*(?=\S)', '', s)
    # Headings glued to the sentence ("Content Earthquake Introduction An
    # earthquake is ...") and interjections ("Oh ! This way, ...").
    s = re.sub(r'^(?:[A-Z][\w\-]*\s+){1,5}(?=(?:A|An|The|In|It|This|These)\s+[a-z])', '', s)
    s = re.sub(r'^(?:oh|ah|well|so|now|wow)\s*[!,]\s*', '', s, flags=re.I)
    # A heading glued to the next sentence: "Kathmandu Kathmandu is the ..."
    s = re.sub(r'\b(\w+)( \1\b)+', r'\1', s)
    # ... or a heading and a list: "Sample story Muna Madan Muna Madan is a
    # classic ...", "The Pacific Ocean Earth's oceans Arctic ... The Pacific
    # Ocean is the largest ...": the subject before the verb already appeared
    # earlier, so what comes before it is not part of the sentence.
    m = re.search(r'\s(?:is|are|was|were)\s', s[:250])
    if m:
        pre = s[:m.start()]
        words = pre.split()
        for n in (4, 3, 2):
            if len(words) > n:
                phrase = ' '.join(words[-n:])
                if phrase[:1].isupper() and phrase in pre[:len(pre) - len(phrase)]:
                    s = s[len(pre) - len(phrase):]
                    break
    return s


_EXERCISE = re.compile(r'\b(discuss|activity|exercise|fig(ure)?\.?\s*\d|answer the following|fill in the blanks|tick|write short)\b', re.I)


def _looks_like_exercise(s: str) -> bool:
    t = s.strip()
    return (t.endswith('?') or bool(re.match(r'^(\(?[a-hivx0-9]{1,3}[.)]\s)', t, re.I))
            or bool(re.match(r'^\([A-Za-z0-9]{1,3}\)\s', t))
            or bool(re.match(r'^\(?[\u0915-\u0939\u0905-\u0914\u0966-\u096f][\u093e-\u094c]?\)\s', t))
            or bool(re.match(r'^\W*(to\s+[a-z]+\s|students?\s+(will|should|can|are able)\b|learning objectives?)', t, re.I))
            or bool(_EXERCISE.search(t[:80])))


def _is_fragment(s: str) -> bool:
    """A sentence cut by a chunk boundary: starts with a lowercase letter, or
    (Nepali) with a vowel sign that belongs to the previous character."""
    t = s.lstrip(' "\'(')
    if not t:
        return False
    if '\u093e' <= t[0] <= '\u094d' or t[0] in '\u0901\u0902\u0903':
        return True
    return t[0].isalpha() and t[0].islower()


_FUNCTION = set('the a an of to in on at for from by with and or is are was were be it this that which as'.split())

_BOILERPLATE = re.compile(r'Related subjects|Background to the schools Wikipedia|SOS Children|'
                          r'Schools selection|Wikipedia, the free encyclopedia|Khan Academy on a Stick|sponsoring a child', re.I)


def _is_noise(s: str) -> bool:
    """OCR debris: map legends, tables ("SEE HEE EEE", "GG नेपाल ७७ ६ ११")."""
    if _BOILERPLATE.search(s):
        return True
    # Devanagari vowel signs are not isalpha(); count them as letters.
    letters = [c for c in s if c.isalpha() or '\u0900' <= c <= '\u097f']
    if len(letters) < 0.6 * len(s.replace(' ', '')):
        return True
    if is_nepali(s):
        # OCR of maps and tables: short Latin junk tokens and dash runs
        # inside Nepali text ("SEE HEE EEE", "=—", "———").
        junk = len(re.findall(r'(?<!\S)[A-Za-z]{1,4}(?!\S)', s)) + len(re.findall(r'[—=]{2,}', s))
        if junk >= 3:
            return True
    words = s.split()
    if not words:
        return False
    if sum(len(w) <= 2 for w in words) > 0.5 * len(words):
        return True
    if re.search(r'https?://|www\.', s):
        return True
    # Glossaries: "Four Passes (n.): ... adrift (adj.): ...".
    if len(re.findall(r'\((?:n|adj|v|adv|prep|pron)\.\)', s)) >= 1:
        return True
    # A list of words, not a sentence (index pages, spelling lists, tag clouds):
    # long, with almost no function words.
    if len(words) >= 12 and not is_nepali(s) and sum(w.lower() in _FUNCTION for w in words) < 0.08 * len(words):
        return True
    # Headings and navigation strung together: "History Discovery Location on Earth".
    latin = [w for w in words if w[:1].isascii() and w[:1].isalpha()]
    return len(latin) >= 4 and sum(w[0].isupper() for w in latin) > 0.6 * len(latin)


_PRONOUN_START = re.compile(r'^\W*(it|he|she|they|this|these|its|his|her|their|such)\b|^\W*(यो|यी|यस|यसले|यसको|यसलाई|यिनी|उनी|उनले|उनको|उनलाई|त्यो|त्यसले|त्यसलाई)(?=\s)', re.I)
_DEFINITIONAL = re.compile(r'\b(is called|are called|is known as|are known as|refers to|is defined as|means)\b', re.I)
_PROPER = re.compile(r'(?<!^)(?<![.!?]\s)\b([A-Z][a-zA-Z]{2,})\b')
# Words that ask for an aspect rather than name the subject: the sources may
# answer "What is the function of the heart?" without the word "function".
_GENERIC = {'function', 'functions', 'role', 'purpose', 'importance', 'meaning', 'type', 'types', 'kind', 'kinds',
            'example', 'examples', 'main', 'part', 'parts', 'feature', 'features', 'characteristic',
            'characteristics', 'cause', 'causes', 'effect', 'effects', 'advantage', 'advantages', 'work', 'works'}
_QWORD = {'who', 'what', 'when', 'where', 'why', 'how', 'which', 'whom', 'whose', 'is', 'are', 'was', 'were',
          'do', 'does', 'did', 'can', 'tell', 'explain', 'define', 'describe', 'name'}


def question_names(question: str) -> list[tuple[str, ...]]:
    """Names of the question ("Gautam Buddha", "Everest", "2026"): the subject
    the answer must be about. Consecutive capitalised words are one name."""
    groups, cur = [], []
    for tok in re.findall(r"[A-Za-z][\w'\-]*|\d+(?:[.,]\d+)*|[^\sA-Za-z\d]", question or ''):
        low = tok.lower()
        if re.match(r'^[A-Z][a-zA-Z]{2,}$', tok) and low not in _QWORD and low not in _STOP:
            cur.append(low)
            continue
        if cur:
            groups.append(tuple(cur))
            cur = []
        if tok[:1].isdigit():
            groups.append((tok,))
    if cur:
        groups.append(tuple(cur))
    return groups


def _has_names(names, text: str) -> bool:
    """Each name of the question is in the text: at least half of its words
    ("Buddha" for "Gautam Buddha", two of "Prithvi Narayan Shah")."""
    terms = set(_terms(text))
    t4 = {w[:4] for w in terms if len(w) >= 4}

    def has(n):
        return n in terms or (len(n) >= 4 and n[:4] in t4)

    return all(sum(has(n) for n in g) * 2 >= len(g) for g in names)


def question_covered(question: str, sources: list[dict]) -> bool:
    """Can these sources answer this question at all?

    Every content word of the question (allowing one miss when the question has
    three or more) must occur in the sources, and every name in it must. "Who
    was the first president of Nepal?" against passages about kings has no
    "president" in them; "Why did Buddha play football?" against a passage on
    football has no "Buddha". No model is asked, and nothing can be made up."""
    qc = _content(question)
    if not qc:
        return True
    src = set(_terms(' '.join(s['text'] for s in sources)))
    src4 = {w[:4] for w in src if len(w) >= 4}

    def has(w):
        return w in src or (len(w) >= 4 and w[:4] in src4)

    if not _has_names(question_names(question), ' '.join(s['text'] for s in sources)):
        return False
    missing = [w for w in qc if not has(w) and w not in _GENERIC]
    allowed = 1 if len(qc) >= 3 else 0
    return len(missing) <= allowed


def _matched(qstems: set[str], stems: set[str]) -> int:
    """How many question stems the sentence has; "high" matches "highest"."""
    n = 0
    for q in qstems:
        if q in stems or (len(q) >= 4 and any(len(s) >= 4 and (s.startswith(q) or q.startswith(s)) for s in stems)):
            n += 1
        elif not q.isascii() and len(q) >= 4 and any(not s.isascii() and s[:4] == q[:4] for s in stems):
            n += 1                  # Nepali inflection: उम्लन्छ / उम्लिने share उम्ल
    return n


def defines(sent: str, topic: set[str]) -> bool:
    """Is this the definition of the question's subject? "An atom is the
    smallest particle ...", "Mammals are animals ...", "... is called
    photosynthesis"."""
    if not topic:
        return False
    if mostly_nepali(sent):
        return _defines_ne(sent, topic)
    # "Mammals (class Mammalia) are ...": the aside is not part of the subject.
    sent = re.sub(r'\s*\([^()]{0,80}\)', '', sent)
    m = _COPULA.search(sent[:120])
    if m:
        head = {_stem(w) for w in _content(sent[:m.start()])}
        # The subject is the topic and nothing else ("The central part of an
        # atom is ..." is not the definition of an atom).
        # ... and what follows defines it: "Fractions are used ..." does not.
        nxt = re.match(r'\s*(?:also\s+|often\s+|usually\s+)?(\w+)', sent[m.end():])
        passive = bool(nxt) and bool(re.match(r'^(\w+ed|\w+en|used|made|found|seen|done|known|born|imbalanced)$', nxt.group(1), re.I)) \
            and not re.match(r'^(called|known|termed|defined|distinguished|characteri[sz]ed|classified|composed|made)$', nxt.group(1), re.I)
        if head and not passive and _matched(topic, head) == len(topic) and _matched(head, topic) == len(head):
            return True
    # Appositive: "Prithvi Narayan Shah, a Gorkha king, set out to ...".
    words = [w for w in re.findall(r"[A-Za-z][\w'\-]*", sent[:200])]
    for i in range(len(words)):
        if not _matched({_stem(words[i].lower())}, topic):
            continue
        span = {_stem(w.lower()) for w in words[i:i + len(topic) + 2] if w.lower() not in _STOP}
        if _matched(topic, span) == len(topic):
            k = sent.find(words[i])
            # The topic opens the sentence ("Prithvi Narayan Shah, a Gorkha
            # king", "In the mid-18th century, Prithvi ..."), it is not inside
            # another noun phrase ("The largest group of mammals, the ...").
            pre = sent[:k].strip()
            if pre and not pre.endswith(',') and pre.lower() not in ('the', 'a', 'an'):
                break
            extra = max(0, len(topic) - 1)
            if re.match(r"(?:[\w'\-]+\s+){0,%d}[\w'\-]+,\s+(?:an?|the|one of the)\s+\w+" % extra, sent[k:k + 160], re.I):
                return True
        break
    m = re.search(r'\b(?:is|are)\s+(?:also\s+|often\s+|usually\s+|commonly\s+|generally\s+)?(?:called|known as|termed)\s+(?:an?\s+|the\s+)?([^,.;]{3,60})', sent, re.I)
    if m:
        named = {_stem(w) for w in _content(m.group(1))}
        # "... is called photosynthesis" / "... the force of gravity", but not
        # a kind of it ("... are called improper fractions").
        exact = _matched(named, topic) == len(named) or re.search(r'\bof\b', m.group(1))
        return bool(named) and _matched(topic, named) == len(topic) and bool(exact)
    return False


def _defines_ne(sent: str, topic: set[str]) -> bool:
    """Nepali definitions: "X भनेको ... हो ।", "X ... थिए/हुन् ।" (X first),
    "Xलाई ... भनिन्छ" (X is called ...), "... लाई X भनिन्छ" (... is called X)."""
    words = re.findall(r'[\u0900-\u097f]+', sent)
    stems = [_stem(w) for w in words]
    t = sorted(topic)
    # Position of the topic: the first word where all topic stems are matched
    # within the next len(topic)+1 words.
    pos = None
    for i in range(len(stems)):
        if _matched({stems[i]}, set(t)) and _matched(set(t), set(stems[i:i + len(t) + 1])) == len(t):
            pos = i
            break
    if pos is None:
        return False
    after = ' '.join(words[pos:pos + len(t) + 2])
    end = re.search(r'(हो|हुन्|थिए|थियो)\s*[।|]?\s*$', sent.strip())
    # Before the topic only a lead-in ("अर्को शब्दमा भन्नुपर्दा, ..."), not
    # a qualifier ("अनुचित भिन्न भनेको" is an improper fraction).
    lead = ' '.join(words[:pos]) + (',' if ',' in sent[:sent.find(words[pos])] else '')
    lead_ok = pos == 0 or bool(re.search(r'(शब्दमा|भन्नुपर्दा|अनुसार|त्यसैले|यसैले|यसरी|अतः|,)\s*$', lead))
    if pos <= 4 and lead_ok and 'भनेको' in after:
        return True
    if pos <= 4 and lead_ok and 'लाई' in after and re.search(r'भनिन्छ\s*[।|]?\s*$', sent.strip()):
        return True
    # "... लाई (एउटा) भिन्न भनिन्छ", but not "... लाई समतुल्य भिन्न भनिन्छ"
    # (an equivalent fraction is not what a fraction is).
    if re.search(r'लाई\s+(?:(?:एउटा|एक)\s+)?' + re.escape(words[pos]) + r'\S*\s+(?:\S+\s+){0,1}भनिन्छ', sent):
        return True
    # "पृथ्वीनारायण शाहको जन्म ... भएको थियो" is about his birth, "यस भिन्नमा
    # ..." is about this fraction: the topic must stand bare, as the subject.
    last = words[min(pos + len(t) - 1, len(words) - 1)]
    if _NE_SUFFIX.search(last) and _NE_SUFFIX.sub('', last) != last:
        return False
    return (pos == 0 or (pos <= 2 and lead_ok)) and bool(end)


def _split_sentences(text: str) -> list[str]:
    text = re.sub(r'\s+', ' ', text or '').strip()
    # A passage that starts mid-word ("reen plants ..."): drop the cut word.
    if _is_fragment(text[:1] + 'x'):
        text = text.split(' ', 1)[-1]
    text = re.sub(r'([.!?])\[\d+\]', r'\1', text)       # "districts.[8] Even ..."
    return [_clean_sentence(x) for x in _SENT_SPLIT.split(text)]


def _usable(sent: str) -> bool:
    return len(sent) >= 25 and not _looks_like_exercise(sent) and not _is_noise(sent)


def _prior(hit: dict) -> float:
    """Small preference for the curriculum, then the topic's own article."""
    sp = str(hit.get('source_path_raw') or hit.get('source_path') or '')
    if hit.get('topic_article'):
        return 0.15
    if '/chapters/' in sp:
        return 0.1
    return 0.0


# "What are the advantages of yoga?" asks what X does for us. The book answers
# with "Yoga makes our body and mind healthy" / "It helps to manage stress",
# which share few words with the question, while a sentence that only NAMES
# the advantages ("one should know the methods, advantages and
# disadvantages of yoga") wins on word overlap. These favour the former.
_BENEFIT_Q = re.compile(r'\b(advantages?|benefits?|importance|merits?|good effects?|uses of)\b', re.I)
_BENEFIT_SENT = re.compile(r'\b(helps?|helped|makes?|keeps?|improves?|increases?|reduces?|prevents?|protects?|'
                           r'develops?|strengthens?|builds?|relieves?|cures?|beneficial|useful|'
                           r'provides?|gives?|supplies?|source of|purif(?:y|ies)|conserves?|regulates?|'
                           r'healthy|fit|strong|important for|good for)\b', re.I)
_BENEFIT_META = re.compile(r'\b(advantages? and disadvantages?|should know|should be (?:followed|worn|done|taken)|'
                           r'rules?|precautions?|cautions?|disadvantages?|can be done|ways? to|to save)\b', re.I)


_ASPECT_VERBS = {'doing', 'using', 'having', 'eating', 'drinking', 'practising', 'practicing', 'important', 'benefit', 'benefits',
                 'merit', 'merits', 'uses'}


def asks_benefits(question: str) -> bool:
    return not is_nepali(question) and bool(_BENEFIT_Q.search(question or ''))


def score_sentences(question: str, hits: list[dict], *, embed=None, pool: int | None = None) -> list[dict]:
    """Every usable sentence of the retrieved passages, scored for how well it
    answers the question, best first.

    Lexical: share of the question's content words in the sentence (a sentence
    starting with "It/He/They" also gets the words of the sentence before it).
    Semantic: cosine similarity of the sentence to the question, with the
    multilingual embedding model already loaded for retrieval (only for the
    `pool` best lexical candidates: it is the slow part on the box).
    Shape: a date for "when", a place for "where", a definition for "what".
    """
    wh = classify_wh(question)
    qc = {_stem(w) for w in _content(question)}
    topic = {_stem(w) for w in _content(question) if w not in _GENERIC}
    names = question_names(question)
    is_def_q = asks_definition(question)
    subject = {_stem(w) for g in names for w in g if not w[:1].isdigit()}
    benefit_q = asks_benefits(question)
    cands = []
    for rank, h in enumerate(hits):
        sents = _split_sentences(h.get('text') or '')
        for i, sent in enumerate(sents):
            if not _usable(sent):
                continue
            ctx = sents[i - 1] if i > 0 and _PRONOUN_START.match(sent) else ''
            stems = {_stem(w) for w in _content(ctx + ' ' + sent)}
            ov = _matched(qc, stems) / max(len(qc), 1)
            if ov == 0:
                continue
            score = ov + 0.3 / (rank + 1) + _prior(h)
            if answers_the_question(sent, question, wh, loose=True):
                score += 0.25
            if benefit_q:
                # "Educating people about the importance of forests ..." names
                # the importance without stating it: as useless as the rules.
                if _BENEFIT_META.search(sent) or _BENEFIT_Q.search(sent):
                    score -= 0.6
                elif _BENEFIT_SENT.search(ctx + ' ' + sent):
                    score += 0.6
            if defines(sent, topic) or (subject and subject != topic and defines(sent, subject)):
                # About the question's subject, not merely mentioning it
                # ("Mount Everest is ... 8,848 metres" for "How high is Mount Everest?").
                score += 0.5 if wh in ('what', 'define', 'who') else 0.3
            elif is_def_q:
                score -= 0.2
            if names and not _has_names(names, ctx + ' ' + sent):
                score -= 0.3
            if re.match(r'\s*(sample answer|answer:|ans\.)', sent, re.I):
                score -= 0.5
            cands.append({'sent': sent, 'ctx': ctx, 'hit': h, 'rank': rank, 'i': i, 'sents': sents,
                          'overlap': ov, 'score': score})
    cands.sort(key=lambda c: c['score'], reverse=True)
    pool = SENTENCE_POOL if pool is None else pool
    if embed is not None and pool > 0 and cands:
        cands, rest = cands[:pool], cands[pool:]
    else:
        rest = []
    if embed is not None and pool > 0 and cands:
        try:
            vecs = embed([question] + [(c['ctx'] + ' ' + c['sent']).strip() for c in cands])
            q = vecs[0]
            for c, v in zip(cands, vecs[1:]):
                c['sim'] = float(sum(a * b for a, b in zip(q, v)))
                c['score'] += 1.2 * c['sim']
        except Exception:
            pass
    cands.sort(key=lambda c: c['score'], reverse=True)
    return cands + rest


def select_evidence(question: str, hits: list[dict], *, max_sources: int = MAX_SOURCES,
                    max_chars: int = MAX_SOURCE_CHARS, embed=None, scored=None) -> list[dict]:
    """The best few short passages for the LLM: around each of the best-scored
    sentences, one per retrieved passage. Returns [{'n', 'text', 'hit',
    'overlap', 'best'}] numbered from 1, best first."""
    scored = scored if scored is not None else score_sentences(question, hits, embed=embed)
    out, used, seen = [], set(), set()
    for c in scored:
        key = id(c['hit'])
        if key in used or c['sent'][:60].lower() in seen:
            continue
        sents, i = c['sents'], c['i']
        lo = i - 1 if c['ctx'] else i
        hi = i
        window = ' '.join(sents[lo:hi + 1])
        # Then the following sentences, while they fit: they often finish
        # the thought ("... It is located in the Himalayas.").
        while hi + 1 < len(sents) and len(window) + len(sents[hi + 1]) + 1 <= max_chars:
            if not _usable(sents[hi + 1]) or _CLASSROOM.search(sents[hi + 1]):
                break
            hi += 1
            window = ' '.join(sents[lo:hi + 1])
        if len(window) > max_chars:
            # Keep the best sentence whole; cut what comes after it.
            keep = len((' '.join(sents[lo:i + 1])))
            window = window[:max(max_chars, keep)].rsplit(' ', 1)[0] if len(window) > max(max_chars, keep) else window
        used.add(key)
        seen.add(c['sent'][:60].lower())
        out.append({'text': window, 'hit': c['hit'], 'overlap': c['overlap'], 'best': c})
        if len(out) >= max_sources:
            break
    for i, c in enumerate(out, start=1):
        c['n'] = i
    return out


def _prompt(question: str, sources: list[dict], wh: str) -> list[dict]:
    src = '\n'.join(f"[{s['n']}] {s['text']}" for s in sources)
    system = (
        'You are a careful teaching assistant for school students in Nepal. '
        'Answer using ONLY facts written in the numbered sources. '
        'Do not add any fact, name, number or date that is not in the sources. '
        f'If the sources do not answer the question, reply exactly {NOT_FOUND}. '
        'Reply in one or two short, simple sentences and end with the source number in brackets, like [1].'
    )
    hint = 'Say what it does for us (its advantages).' if asks_benefits(question) else WH_HINT.get(wh, '')
    user = f"Sources:\n{src}\n\nQuestion: {question}\n{hint}"
    return [{'role': 'system', 'content': system}, {'role': 'user', 'content': user}]


def generate(question: str, sources: list[dict], wh: str) -> dict:
    """Call the local LLM. Returns {'text', 'ms', 'error'}."""
    body = {
        'messages': _prompt(question, sources, wh),
        'temperature': 0,
        'top_k': 1,
        'max_tokens': LLM_MAX_TOKENS,
        'cache_prompt': True,
        'repeat_penalty': 1.15,
        'repeat_last_n': 64,
        'stop': ['\n\n', 'Question:', 'Sources:'],
    }
    t0 = time.time()
    try:
        req = urllib.request.Request(
            LLM_URL + '/v1/chat/completions',
            data=json.dumps(body).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
        )
        with urllib.request.urlopen(req, timeout=LLM_TIMEOUT) as r:
            d = json.loads(r.read().decode('utf-8'))
        text = (d['choices'][0]['message'].get('content') or '').strip()
        text = re.sub(r'<think>.*?</think>', '', text, flags=re.S).strip()
        # "..., as mentioned in sources [1] and [2]." is talk about the
        # sources, not part of the answer.
        text = re.sub(r',?\s*\(?(?:as\s+(?:mentioned|stated|given|described|shown)\s+in|according\s+to|from|see)\s+'
                      r'(?:the\s+)?sources?\s*(?:\[?\d+\]?(?:\s*(?:,|and)\s*\[?\d+\]?)*)?\)?', '', text, flags=re.I).strip()
        if not re.search(r'[.!?।](\s*\[\d+\])*\s*$', text):
            # Cut off mid-sentence (max_tokens or a stop string): keep only
            # the complete sentences.
            # A short answer with no full stop ("1768 [1]") is kept as it is.
            m = re.match(r'(.*[.!?।](?:\s*\[\d+\])*)', text, flags=re.S)
            if m:
                text = m.group(1).strip()
        return {'text': text, 'ms': int((time.time() - t0) * 1000), 'error': None}
    except Exception as exc:  # LLM down / timeout: caller falls back
        return {'text': '', 'ms': int((time.time() - t0) * 1000), 'error': str(exc)[:200]}


def verify(answer: str, sources: list[dict], question: str = '') -> tuple[bool, list[str]]:
    """True if everything the answer asserts is written in the sources (words
    taken from the question are its topic, not claims).

    Returns (ok, unsupported_terms)."""
    body = _CITE.sub('', answer or '')
    src_text = ' '.join(s['text'] for s in sources) + ' ' + (question or '')
    src_terms = set(_terms(src_text))
    src_stems = {_stem(w) for w in src_terms}
    src_nums = {n.replace(',', '') for n in _NUM.findall(src_text)}

    unsupported = []
    for n in _NUM.findall(body):
        if n.replace(',', '') not in src_nums:
            unsupported.append(n)
    # Proper nouns: capitalised words not at the start of a sentence.
    for m in re.finditer(r'(?<![.!?]\s)(?<!^)\b([A-Z][a-z]{2,})\b', body):
        w = m.group(1).lower()
        if w not in src_terms and _stem(w) not in src_stems:
            unsupported.append(m.group(1))
    content = _content(body)
    src4 = {w[:4] for w in src_terms if len(w) >= 4}
    missing = [w for w in content if w not in src_terms and _stem(w) not in src_stems
               and (len(w) < 4 or w[:4] not in src4)]
    if content and len(missing) / len(content) > 0.34:
        unsupported.extend(missing)
    return (not unsupported), sorted(set(unsupported))


def answers_the_question(answer: str, question: str, wh: str, loose: bool = False) -> bool:
    """Does the answer have the SHAPE the question asks for?

    Small models sometimes return a true sentence that does not answer
    ("Where is Everest?" -> "Everest is the highest peak"). A "when" answer
    must carry a date or number, a "where" or "who" answer a name that the
    question did not already contain, a "how many" answer a number."""
    body = _CITE.sub('', answer or '')
    if is_nepali(question):
        return _answers_ne(body, question, wh)
    q_terms = set(_terms(question))
    # It must say something the question did not ("The capital of Nepal is.").
    q_stems = {_stem(w) for w in q_terms}
    if not ({_stem(w) for w in _content(body)} - q_stems) and not _NUM.search(body):
        return False
    # Capitalised words that are not the first word of a sentence.
    new_names = [m.group(1) for m in re.finditer(r'(?<![.!?]\s)(?<!^)\b([A-Z][a-zA-Z]{2,})\b', body.strip())
                 if m.group(1).lower() not in q_terms]
    if re.search(r'\bhow (many|much|high|long|far|old|big|tall|deep)\b', question, re.I) or re.search(
            r'\bwhat (is|was|are) the (speed|height|weight|mass|temperature|distance|length|area|population|value|'
            r'boiling point|melting point|freezing point|age|number|size|depth|altitude|elevation)\b', question, re.I):
        return bool(_NUM.search(body))
    if wh == 'how' and loose:
        # A quoted sentence for "How do plants make food?" must describe a way.
        return bool(re.search(r'\b(by|using|through|with the help of|in the presence of|process|steps?|first|then|when)\b', body, re.I))
    if wh == 'when':
        # A date: a year, a month, a century, not "40 million refugees".
        return bool(re.search(r'\b(1\d{3}|20\d{2})s?\b|\b\d{1,4}\s*(BC|BCE|AD|CE|B\.S\.|BS|VS)\b|[०-९]{4}', body)) or bool(re.search(
            r'\b(century|period|era|age|january|february|march|april|may|june|july|august|september|october|november|december)\b',
            body, re.I))
    if wh == 'where':
        # A named place. A model's "in the world" is not accepted; a quoted
        # textbook sentence ("takes place in the leaves") may locate with a
        # preposition (loose=True).
        if not loose:
            return bool(new_names)
        # A quoted sentence must place something: "lies in Nepal", "located in
        # the Himalayas", "takes place in the leaves" (not just any name).
        if re.search(r'\b(lies|lie|located|situated|found|takes place|occurs)\b', body):
            return True
        return any(m.group(2).lower() not in q_terms
                   for m in re.finditer(r'\b(in|at|near|inside)\s+(?:the\s+)?([A-Z]\w+|(?<=the )\w{3,})', body))
    if wh == 'why':
        # A reason: "because ...", "due to ...", "... faster than ...".
        return bool(re.search(r'\b(because|due to|since|so that|as a result|therefore|thus|hence|caus\w*|reasons?|'
                              r'in order to|leads? to|results? in|(?:faster|slower|quicker|higher|lower|heavier|lighter|denser|'
                              r'hotter|colder|warmer|cooler|bigger|smaller|stronger|weaker)\s+than)\b', body, re.I))
    if wh == 'who' and not re.match(r'^\s*who\s+(is|was|were|are)\s+[A-Z]', question):
        # "Who invented X?" needs a name; "Who was Y?" is answered by describing Y.
        return bool(new_names)
    return True


def _answers_ne(body: str, question: str, wh: str) -> bool:
    """The shape of an answer, for Nepali questions."""
    qs = {_stem(w) for w in _content(question)}
    new = [w for w in _content(body) if _matched({_stem(w)}, qs) == 0]
    if not new and not _NUM.search(body):
        return False
    if 'कति' in question and re.search(r'(छ|छन्|हो|हुन्)\s*[?।]?\s*$', question.strip()):
        # "सगरमाथाको उचाइ कति छ?" asks for a measure: the answer states it
        # ("... ८८४८ मिटर छ ।"), it does not narrate ("... उचाइ आरोहण गरे ।").
        return bool(_NUM.search(body)) and bool(re.search(
            r'(छ|छन्|हो|हुन्|हुन्छ|पर्छ|रहेको\s+छ)\s*[।|.]?\s*$', body.strip()))
    if 'कति' in question or wh == 'when':
        return bool(_NUM.search(body)) or (wh == 'when' and bool(re.search(r'(साल|सम्वत्|संवत्|शताब्दी|गते|वि\.\s*सं)', body)))
    if wh == 'where':
        # A place: a new word with the locative "मा", or "जहाँ ..." ("where").
        if re.search(r'(^|\s)(यही|त्यही|यस|त्यस)\S*\s+स्थान', body):
            return False
        return any(w.endswith('मा') and len(w) > 3 for w in new) or 'जहाँ' in body or bool(
            re.search(r'(स्थान|जिल्ला|प्रदेश|अञ्चल)\S*\s+\S+', body))
    if wh == 'why':
        return bool(re.search(r'(किनभने|किनकि|कारण|गर्दा|भएकाले|भएकोले|हुनाले|गर्नाले|हुँदा|ले\s+गर्दा)', body))
    if wh == 'how':
        return bool(re.search(r'(गरी|गरेर|द्वारा|बाट|प्रक्रिया|पहिले|त्यसपछि|प्रयोग)', body))
    return True


def supported_by_one_passage(answer: str, sources: list[dict], question: str = '') -> tuple[bool, str]:
    """Are the answer's facts written TOGETHER, about the question's subject,
    in one sentence of the sources?

    verify() checks each word exists somewhere; a small model can still stitch
    words from different sentences into a false claim ("The first president of
    Nepal was Lalitpur", "The Rana regime ended in 1972" from "...the Rana
    regime... King Mahendra (ruled 1955-1972)..."). Here the answer's numbers
    and names must all occur, with at least 70% of its other content words, in
    ONE sentence that also carries the question's subject. A sentence that
    starts with "It/He/They" is read together with the one before it.
    Returns (ok, best_window)."""
    body = _CITE.sub('', answer or '')
    # The question's own words are its topic, not a claim to prove.
    given = set(_terms(question))
    given_stems = {_stem(w) for w in given}
    words = {_stem(w) for w in _content(body)} - given_stems
    # "advantages", "importance" ask for an aspect; the sentence that gives
    # it ("Yoga makes our body healthy") need not repeat the word.
    q_words = ({_stem(w) for w in _content(question) if w not in _GENERIC and w not in _ASPECT_VERBS}
               or {_stem(w) for w in _content(question)})
    names = question_names(question)
    facts = {n.replace(',', '') for n in _NUM.findall(body)} - given
    facts |= {m.group(1).lower() for m in re.finditer(r'(?<![.!?]\s)(?<!^)\b([A-Z][a-z]{2,})\b', body.strip())
              if m.group(1).lower() not in given}
    if not words and not facts:
        return True, ''
    best, best_win = -1.0, ''
    for s in sources:
        sents = [x for x in _SENT_SPLIT.split(s['text']) if x.strip()] or [s['text']]
        for i in range(len(sents)):
            win = (sents[i - 1] + ' ' + sents[i]) if i > 0 and _PRONOUN_START.match(sents[i]) else sents[i]
            terms = set(_terms(win))
            stems = {_stem(w) for w in terms}
            nums = {n.replace(',', '') for n in _NUM.findall(win)}
            if any((f not in nums) if f[:1].isdigit() else (f not in terms and _stem(f) not in stems) for f in facts):
                continue
            # "X ... . He was born in 1723": the pronoun sentence carries the
            # fact, the one before it the subject. Not the other way round:
            # "Frank Borman ... orbit around the Moon. They ... the King James
            # Bible" does not make Borman a king of the Moon.
            if win != sents[i]:
                own = set(_terms(sents[i]))
                own_stems = {_stem(w) for w in own}
                own_nums = {n.replace(',', '') for n in _NUM.findall(sents[i])}
                if any((f not in own_nums) if f[:1].isdigit() else (f not in own and _stem(f) not in own_stems)
                       for f in facts):
                    continue
            # The question's subject must be in the same sentence as the facts,
            # or the answer ties a fact to the wrong subject.
            if q_words and len(q_words & stems) / len(q_words) < 0.5:
                continue
            if names and not _has_names(names, win):
                continue
            if not restates_question(question, win):
                continue
            if not _numbers_near_topic(facts, win, q_words):
                continue
            cover = len(words & stems) / max(len(words), 1)
            if cover > best:
                best, best_win = cover, win
    return best >= 0.7, best_win


def _light(w: str) -> str:
    """Strip only an inflection: "invented" -> "invent", but "climber" stays
    "climber" (not "climb", the way _stem() would cut it)."""
    if not w.isascii() or len(w) <= 3:
        return w
    w = _IRREGULAR.get(w, w)
    if re.search(r'(ss|us|is)$', w):
        return w
    if re.search(r'(s|x|z|ch|sh)es$', w):
        return w[:-2]
    if w.endswith('ies') and len(w) > 4:
        return w[:-3] + 'y'
    if w.endswith('s'):
        return w[:-1]
    if len(w) > 5 and w.endswith('ed'):
        return w[:-1] if w.endswith(('ated', 'ized', 'ised', 'ured', 'ided')) else w[:-2]
    if len(w) > 5 and w.endswith('ing'):
        return w[:-3]
    return w


# Irregular verb forms a question and its answer sentence may use differently.
_IRREGULAR = {'wrote': 'write', 'written': 'write', 'writes': 'write', 'born': 'bear', 'bore': 'bear',
              'began': 'begin', 'begun': 'begin', 'built': 'build', 'found': 'find', 'made': 'make',
              'grew': 'grow', 'grown': 'grow', 'took': 'take', 'taken': 'take', 'gave': 'give', 'given': 'give',
              'won': 'win', 'led': 'lead', 'ran': 'run', 'became': 'become', 'came': 'come', 'went': 'go',
              'gone': 'go', 'saw': 'see', 'seen': 'see', 'fought': 'fight', 'taught': 'teach', 'thought': 'think',
              'brought': 'bring', 'bought': 'buy', 'sold': 'sell', 'told': 'tell', 'held': 'hold', 'kept': 'keep',
              'fell': 'fall', 'fallen': 'fall', 'died': 'die', 'flew': 'fly', 'flown': 'fly', 'rose': 'rise',
              'risen': 'rise', 'lay': 'lie', 'lain': 'lie'}


def restates_question(question: str, text: str) -> bool:
    """Does the text contain the claim the question asks about? Every content
    word of the question that is not a name (names are checked separately)
    must be in it, inflection aside; one may be missing in a long question.
    "When did the first person climb Mount Everest?" is not answered by "On 7
    October 2000 ... became the first person to descend by ski from ... Everest"
    (no "climb"; "climber" is not "climb")."""
    if is_nepali(question):
        return True
    names = {w for g in question_names(question) for w in g}
    want = {_light(w) for w in _content(question) if w not in names and w not in _GENERIC and w not in _ASPECT_VERBS}
    if not want:
        return True
    # A word inside a name is not the word: "the King James Bible" does not say
    # "king" ("Who was the first king of the Moon?").
    # A run that is the question's own phrase ("Federal Democratic Republic")
    # still counts.
    in_names = set()
    for m in re.finditer(r'(?<![.!?]\s)(?<!^)\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+', text.strip()):
        run = [w.lower() for w in m.group(0).split()]
        if not all(_light(w) in want or w in _STOP for w in run):
            in_names.update(run)
    lower = set(_terms(re.sub(r'\b[A-Z]\w*', '', text)))
    have = {_light(w) for w in _terms(text) if w not in in_names or w in lower}
    missing = [w for w in want if w not in have]
    if len(missing) > (1 if len(want) >= 4 else 0):
        return False
    # "the first king of the Moon" is one claim: the words scattered over a
    # sentence ("first mentioned ... king of Saba ... the moon god") are not.
    m = re.search(r'\b([a-z]+)\s+of\s+(?:the\s+)?([A-Za-z]+(?:\s+[A-Za-z]+)?)\s*\??$', question.strip())
    if m and m.group(1) not in _STOP and _light(m.group(1)) in want:
        head, tail = _light(m.group(1)), [_light(w) for w in m.group(2).lower().split() if w not in _STOP]
        toks = [_light(re.sub(r"['’]s$", '', w)) for w in _terms(text)]
        hp = [i for i, t in enumerate(toks) if t == head]
        tp = [i for i, t in enumerate(toks) if t == tail[-1]] if tail else []
        # Within four words, either order: "king of unified Nepal", "Nepal's
        # capital", "matter exists in three states".
        if tail and not any(abs(a - b) <= 4 for a in hp for b in tp):
            return False
    return True


def _numbers_near_topic(facts: set[str], text: str, q_words: set[str], reach: int = 12) -> bool:
    """Each number of the answer must stand within `reach` words of a word of
    the question. A run-on OCR sentence can hold the question's words and a
    year that belongs to something else ("... King Mahendra (ruled
    1955-1972) ... against any Nepali regime")."""
    nums = [f for f in facts if f[:1].isdigit()]
    if not nums or not q_words:
        return True
    toks = [t.replace(',', '') for t in _terms(text)]
    qpos = [i for i, t in enumerate(toks) if _stem(t) in q_words]
    for n in nums:
        npos = [i for i, t in enumerate(toks) if t == n]
        if not npos or not qpos or min(abs(a - b) for a in npos for b in qpos) > reach:
            return False
    return True


_COPULA = re.compile(r'\b(is|are|was|were|means)\b', re.I)


def says_something(answer: str, question: str, wh: str) -> bool:
    """False for empty or circular answers: "The heart is the heart is one of
    ...", "The speed of light is the speed of light in a vacuum"."""
    body = _CITE.sub('', answer or '').lower()
    words = _terms(body)
    # A model stuck in a loop repeats itself ("the heart is the heart is"); a
    # quoted sentence may repeat a short phrase ("the earth surface").
    n = 5 if wh == 'quote' else 3
    grams = [' '.join(words[i:i + n]) for i in range(len(words) - n + 1)]
    if len(grams) != len(set(grams)):
        return False
    topic = {_stem(w) for w in _content(question)}
    new = {_stem(w) for w in _content(body)} - topic
    if not new and not _NUM.search(body):
        return False
    if wh in ('what', 'define', 'who'):
        m = _COPULA.search(body)
        if m:
            subject = {_stem(w) for w in _content(body[:m.start()])}
            pred = {_stem(w) for w in _content(body[m.end():])}
            # A definition that repeats its subject defines nothing.
            if pred & subject:
                return False
            # "X is ..." must say at least two new things about X, unless the
            # new information is the subject ("Kathmandu is the capital ...").
            if not (subject - topic) and len(pred - topic) < 2:
                return False
    return True


def cited_sources(answer: str, sources: list[dict]) -> list[int]:
    ns = {int(n) for n in _CITE.findall(answer or '')}
    valid = {s['n'] for s in sources}
    return sorted(ns & valid) or ([sources[0]['n']] if sources else [])


def _quotable(sent: str, question: str, wh: str) -> bool:
    """A sentence may be quoted as the answer only if it clearly concerns the
    question and has the shape of an answer."""
    qc = {_stem(w) for w in _content(question)}
    sc = {_stem(w) for w in _content(sent)}
    # Nepali inflects heavily, so fewer of its question words survive verbatim.
    need = 1.0 if len(qc) <= 2 else (0.75 if wh == 'when' else 0.5)
    if qc and len(sc & qc) / len(qc) < need:
        return False
    # The question's most specific word (the longest) must be in the quote:
    # "Why do we need to save water?" is about water, not about saving.
    key = max(_content(question), key=len, default='')
    if key and _stem(key) not in sc and _light(key) not in {_light(w) for w in _content(sent)}:   # wrote ~ written
        return False
    if not _has_names(question_names(question), sent):
        return False
    if not answers_the_question(sent, question, wh, loose=True):
        return False
    if (wh in ('when', 'where', 'which') or (wh == 'who' and not asks_definition(question))
            or re.match(r'^\s*how\s+(do|does|did|can|could|is|are|was|were|to)\b', question or '', re.I)
            or re.search(r'\bhow (many|much)\b', question, re.I)) and not restates_question(question, sent):
        return False
    # "What is the function of the lungs?": a sentence about the lungs, not one
    # that mentions their function ("Kapalbhati increases the function ...").
    if re.search(r'\b(function|role|purpose|use|importance)s?\s+of\b', question, re.I):
        subj = {_stem(w) for w in _content(re.split(r'\bof\b', question, 1, flags=re.I)[1])}
        if not defines(sent, subj) and not _matched(subj, {_stem(w) for w in _content(' '.join(sent.split()[:3]))}):
            return False
    # Superlatives: "What is the longest river in Nepal?" needs "the longest
    # river" or "<noun> ... is the longest", not "one of the longest jumps".
    m = re.search(r'\bthe\s+(\w+est|most \w+|largest|biggest)\s+(\w+)', question or '', re.I)
    if m and not is_nepali(question):
        sup, noun = m.group(1).lower(), _light(m.group(2).lower())
        lw = ' '.join(_light(w) for w in _terms(sent))
        if not (re.search(r'\b' + re.escape(sup) + r' ' + re.escape(noun), lw)
                or re.search(r'\b' + re.escape(noun) + r'\b.{0,60}\b(is|are|was|were) the ' + re.escape(sup) + r'\b(?!\s+\w+\s+' + re.escape(noun) + r')', lw)):
            return False
        # "the second highest mountain" is not the highest.
        if re.search(r'\b(second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th))\s+' + re.escape(sup), lw):
            return False
        # "... in the world?" is not answered by "the largest country in South
        # America": the question's scope must be the sentence's too.
        scope = re.search(r'\b' + re.escape(m.group(2)) + r'\s+(?:in|of|on)\s+(?:the\s+)?([\w\s]+?)\s*\??$', question, re.I)
        if scope:
            sw = {_stem(w) for w in _content(scope.group(1))}
            ss = {_stem(w) for w in _content(re.sub(r"\bearth(?:'s|s)?\b", 'world', sent, flags=re.I))}
            if sw and _matched(sw, ss) < len(sw):
                return False
    if is_nepali(question):
        # Every word of the question, inflection aside ("राष्ट्रिय फूल", not
        # "राष्ट्रिय पण" — the national bird).
        qn = {_stem(w) for w in _content(question)}
        miss = len(qn) - _matched(qn, {_stem(w) for w in _content(sent)})
        if miss > (1 if len(qn) >= 4 else 0):
            return False
        # "त्रिभुवन को थिए?" asks about a person: "... थिए/हुन्", not "... ठाउँ हो".
        if re.search(r'को\s+(थिए|हुन्)\s*\??\s*$', question.strip()) and not re.search(
                r'(थिए|हुन्|हुनुहुन्थ्यो|हुनुहुन्छ|भनिन्छ)\s*[।|]?\s*$', sent.strip()):
            return False
    # A sentence whose start is in another chunk has lost its subject; so has
    # one that starts with a pronoun ("It is 8,611 metres.").
    if _is_fragment(sent) or re.match(
            r'^\W*(?:(?:it|they|he|she|this|these|those)\s+(?:also\s+)?(?:is|are|was|were|has|have|had|can|could|will|'
            r'would|may|must|does|do|did)\b|(?:its|their|his|her)\s+\w+)', sent, re.I):
        return False
    # "What is the currency of Nepal?": the sentence must say what it is
    # ("X is the currency ...", "..., the currency of Nepal"), not merely use
    # the words ("While exchanging currency of other countries in Nepal ...").
    m = re.match(r'^\s*(?:what|which)\s+(?:is|are|was|were)\s+the\s+(\w+)', question or '', re.I)
    if m and not is_nepali(question):
        x = re.escape(m.group(1))
        if not re.search(r'\b(is|are|was|were)\b(?:\W+\w+){0,8}?\W+' + x + r'|\b' + x + r'\w*\b(?:\W+\w+){0,8}?\W+(is|are|was|were)\b|,\s+the\s+(?:\w+\s+){0,2}' + x + r'\w*(?:\s+(?:of|in)\s+\w+)?\s*[.;]?\s*$',
                         sent, re.I):
            return False
    # A sentence cut by the end of the passage ("त्यसैले पृथ्वीनारायण शाहलाई नेपालको").
    if not re.search(r'[.!?।|]["\'”’)\]]*\s*$', sent.strip()):
        return False
    topic = {_stem(w) for w in _content(question) if w not in _GENERIC}
    # "Who was Prithvi Narayan Shah?" / "What is gravity?": quote the sentence
    # that defines the subject, not one that merely mentions it ("Ranabahadur
    # Shah, the grandson of Prithvi Narayan Shah, was the king").
    if asks_definition(question) and (not defines(sent, topic) or _is_fragment(sent)):
        return False
    # A date or count must belong to the question's subject.
    if (wh == 'when' or re.search(r'\bhow (many|much)\b', question, re.I)) and not is_nepali(question):
        nums = set(n.replace(',', '') for n in _NUM.findall(sent))
        tq = {_stem(w) for w in _content(question) if w not in _GENERIC and not w.isdigit()}
        if not any(all(_numbers_near_topic({n}, sent, {t}, reach=10) for t in tq) for n in nums):
            return False
    return says_something(sent, question, 'quote')


_NE_DEF_Q = re.compile(r'^\s*(.+?)\s*(?:भनेको\s+के\s+(?:हो|हुन्)|के\s+(?:हो|हुन्)|को\s+(?:हुन्|हो|थिए|थियो))\s*[?।]?\s*$')


def definition_subject(question: str) -> str | None:
    """X in "What is X?", "Who was X?", "Define X", "X भनेको के हो?", "X को
    हुन्?", when X is one thing (not "the capital of Nepal", which asks for
    another thing)."""
    if is_nepali(question):
        m = _NE_DEF_Q.match(question or '')
        if not m:
            return None
        x = m.group(1).strip()
        # "नेपालको राजधानी" (the capital OF Nepal) asks for something else.
        if len(x.split()) > 3 or any(re.search(r'(को|का|की)$', w) for w in x.split()[:-1]):
            return None
        return x
    m = re.match(r'^\s*(?:what|who)\s+(?:is|are|was|were)\s+(?:an?\s+|the\s+)?(.+?)\s*\??$', question or '', re.I) \
        or re.match(r'^\s*(?:define|meaning of|what is meant by)\s+(?:an?\s+|the\s+)?(.+?)\s*\??$', question or '', re.I)
    if not m:
        return None
    x = m.group(1).strip()
    if re.search(r'\b(of|in|for|between|on|at|from|to|that|which|who|do|does|did)\b', x, re.I) or len(x.split()) > 4:
        return None
    # "What is the largest ocean?" asks which one, not what an ocean is.
    if re.search(r'\b(\w{3,}est|most|least|first|last|main|national|official|best|worst)\b', x, re.I):
        return None
    return x


def asks_definition(question: str) -> bool:
    return definition_subject(question) is not None


def extractive(question: str, sources: list[dict], wh: str = 'what', scored=None) -> tuple[str, int | None]:
    """The best-scored source sentence that passes _quotable(), verbatim, and
    its source number. A sentence starting with "It/He/They" is quoted with
    the sentence before it, so the quote says who or what it is about."""
    by_hit = {id(s['hit']): s['n'] for s in sources}
    for c in (scored or [])[:8]:
        n = by_hit.get(id(c['hit']))
        if n is None:
            continue
        sent = (c['ctx'] + ' ' + c['sent']).strip()
        if not _quotable(sent, question, wh):
            continue
        # The next sentence often finishes the thought: "... by a number of
        # shared features. That includes warm blood, body hair ...", "A noun is
        # a part of speech. Nouns are words that name a person, place ...".
        if wh not in ('when', 'where') and c['i'] + 1 < len(c['sents']):
            nxt = c['sents'][c['i'] + 1]
            topic = {_stem(w) for w in _content(question) if w not in _GENERIC}
            first = {_stem(w) for w in _content(' '.join(nxt.split()[:2]))}
            if (_usable(nxt) and len(sent) + len(nxt) <= 360
                    and (re.match(r'^\W*(that|these|this|they|it|such|those)\b', nxt, re.I) or _matched(topic, first))):
                sent = sent + ' ' + nxt
        return sent, n
    return '', None


def answer(question: str, hits: list[dict], *, min_overlap: float = 0.15, embed=None) -> dict:
    """Full grounded answer. Never raises.

    embed: optional callable(list[str]) -> unit vectors (the retrieval
    model), used to rank sentences by meaning.
    Returns {answer, answer_source, wh_kind, sources, cited, llm_ms, rejected}.
    answer_source: 'llm' (verified), 'extract' (verbatim sentence), 'none'.
    """
    wh = classify_wh(question)
    scored = score_sentences(question, hits, embed=embed)
    sources = select_evidence(question, hits, scored=scored)
    out = {'wh_kind': wh, 'sources': sources, 'cited': [], 'llm_ms': None, 'rejected': None,
           'answer': '', 'answer_source': 'none',
           'scored': [{'score': round(c['score'], 3), 'sim': round(c.get('sim', 0), 3), 'ov': round(c['overlap'], 2),
                       'rank': c['rank'], 'sent': (c['ctx'] + ' ' + c['sent']).strip()[:240]} for c in scored[:10]]}
    relevant = [s for s in sources if s['overlap'] >= min_overlap] or (sources if is_nepali(question) else [])
    if not relevant:
        return out
    sources = relevant
    for i, src in enumerate(sources, start=1):
        src['n'] = i
    out['sources'] = sources

    if not question_covered(question, sources):
        out['rejected'] = {'reason': 'question_not_covered'}
        return out

    # "What is X?" / "Who was X?": the book's own definition is the best
    # answer; a small model can only paraphrase it, or get it wrong.
    if asks_definition(question):
        sent, n = extractive(question, sources, wh, scored=scored)
        if sent:
            out.update(answer=sent, answer_source='extract', cited=[n])
            return out

    if LLM_ENABLED and not is_nepali(question):
        g = generate(question, sources, wh)
        out['llm_ms'] = g['ms']
        text = g['text']
        if g['error']:
            out['rejected'] = {'reason': 'llm_error', 'detail': g['error']}
        elif not _content(_CITE.sub('', text)) or NOT_FOUND in text.upper().replace(' ', '_'):
            # The model read the sources and found no answer: say "not found".
            # LOOMA_RAG_QUOTE_AFTER_NOT_FOUND=1 still tries a verbatim quote
            # (every check in _quotable() applies); use it with a fine-tuned
            # model that says NOT_FOUND readily.
            out['rejected'] = {'reason': 'not_found'}
            if not QUOTE_AFTER_NOT_FOUND:
                return out
        else:
            # One claim per answer for factual questions (two for why/how): a
            # second sentence is where a small model wanders off.
            sents = [x.strip() for x in re.split(r'(?<=[.!?।])\s+', text) if _content(_CITE.sub('', x))]
            text = ' '.join(sents[:2 if wh in ('why', 'how') or asks_benefits(question) else 1]) or text
            ok, bad = verify(text, sources, question)
            for one in re.split(r'(?<=[.!?।])\s+', text):
                if ok and _content(_CITE.sub('', one)) and not supported_by_one_passage(one, sources, question)[0]:
                    ok, bad = False, ['<facts not stated together in one source passage>']
            if ok and not answers_the_question(text, question, wh):
                ok, bad = False, ['<does not answer the ' + wh + ' question>']
            if ok and not says_something(text, question, wh):
                ok, bad = False, ['<circular or empty answer>']
            if ok and asks_definition(question):
                topic = {_stem(w) for w in _content(question) if w not in _GENERIC}
                if not defines(_CITE.sub('', text), topic):
                    ok, bad = False, ['<not a definition of the subject>']
            if ok:
                out['cited'] = cited_sources(text, sources)
                ans = _CITE.sub('', text).replace(' .', '.').strip()
                if ans[:1].isalpha() and ans[:1].islower():
                    ans = '…' + ans          # copied from mid-sentence in the source
                out['answer'] = ans
                out['answer_source'] = 'llm'
                return out
            out['rejected'] = {'reason': 'unsupported', 'terms': bad[:10], 'text': text[:300]}

    sent, n = extractive(question, sources, wh, scored=scored)
    if sent:
        out['answer'] = sent
        out['answer_source'] = 'extract'
        out['cited'] = [n]
    return out


# ---------------------------------------------------------------------------
# Open answer: the fallback when answer() found no verified answer.
#
# Looma holds far more than the textbooks (Wikipedia for Schools, Khan, TED,
# videos, listening texts...), and the retrieval already searches all of it.
# When the checks above cannot pin the answer to one passage, the LLM still
# writes one from the best retrieved passages, and completes it with what it
# knows; with nothing retrieved, from what it knows alone. The answer is not
# verified, so it comes back as answer_source 'llm_open' and the UI says so.
# ---------------------------------------------------------------------------
OPEN_ENABLED = (os.environ.get('LOOMA_RAG_OPEN_ANSWER') or '1').strip().lower() not in {'0', 'false', 'no', 'off'}
OPEN_MAX_TOKENS = int(os.environ.get('LOOMA_LLM_OPEN_MAX_TOKENS') or 150)
OPEN_MAX_SOURCES = 4
_UNIT_LEADIN = re.compile(r'^\W*(?:unit|lesson|chapter)\s+\d+\s*[:.\-]?\s+', re.I)


def _open_prompt(question: str, passages: list[str], nepali: bool) -> list[dict]:
    lang = 'Nepali' if nepali else 'English'
    system = (
        'You are a friendly teaching assistant for school students in Nepal. '
        f'Answer the question correctly in two or three short, simple sentences in {lang}. '
        'The first sentence must answer exactly what the question asks. '
        + ('Use the facts in the passages from the Looma library; if they only partly answer the question, '
           'complete the answer with what you know for sure. Do not talk about the passages. '
           if passages else 'Use what you know for sure. ')
        + "If you do not know, reply exactly I don't know."
    )
    ctx = '\n'.join(f'- {p}' for p in passages)
    user = (f'Passages:\n{ctx}\n\n' if passages else '') + f'Question: {question}'
    return [{'role': 'system', 'content': system}, {'role': 'user', 'content': user}]


# Classroom instructions copied from a teacher guide are never an answer.
_CLASSROOM = re.compile(r'\b(this (?:task|activity|exercise|lesson|unit)|the students|ask (?:the )?students|'
                        r'students? (?:practi[cs]e|will|should|can)|teacher|grammar|homework|in groups?)\b', re.I)


def _clean_open(text: str, question: str) -> str:
    text = re.sub(r'<think>.*?</think>', '', text or '', flags=re.S)
    text = _CITE.sub('', text)
    text = re.sub(r'\[[^\]]{0,200}\]', '', text)          # "[Rainbows can be ...]" pasted sources
    text = re.sub(r'^\W*(?:answer|उत्तर)\s*[:：]\s*', '', text.strip(), flags=re.I)
    text = re.sub(r'\b(?:according to|as (?:mentioned|stated|given) in|based on) (?:the )?(?:passages?|sources?|text)\s*,?\s*',
                  '', text, flags=re.I)
    text = _UNIT_LEADIN.sub('', text)
    sents = [s.strip() for s in re.split(r'(?<=[.!?।])\s+', text) if s.strip()]
    # Drop the question echoed back (a sentence ending in "?", or the question
    # itself) and "I don't know" tacked on after an answer. "Plato was born in
    # Athens." uses only the question's words and IS the answer, so word
    # overlap alone is no reason to drop a sentence.
    qnorm = re.sub(r'\W+', ' ', question).strip().lower()
    sents = [s for s in sents
             if not s.endswith('?')
             and not _CLASSROOM.search(s)
             and re.sub(r'\W+', ' ', s).strip().lower() != qnorm
             and not re.search(r"\bi\s+(?:do not|don't)\s+know\b|NOT_FOUND", s, re.I)]
    out = ' '.join(dict.fromkeys(sents[:3])).replace(' .', '.').strip()
    if out and not re.search(r'[.!?।]$', out):
        m = re.match(r'(.*[.!?।])', out, flags=re.S)
        out = m.group(1).strip() if m and len(m.group(1)) > 20 else out
    return out


def open_passages(question: str, sources: list[dict], hits: list[dict] | None = None) -> list[str]:
    """The passages open_answer() shows the LLM (also used to build its
    fine-tuning data, so training sees exactly what the box sends)."""
    nepali = is_nepali(question)
    passages, seen = [], set()
    # The selected evidence windows are the best passages; whole raw chunks
    # (teacher-guide instructions, unrelated exercises) only fill in when
    # fewer than two windows were found: the small model copies from
    # whatever it is given.
    extra = [h.get('text') for h in hits or []] if len(sources or []) < 2 else []
    for t in [s.get('text') for s in sources or []] + extra:
        t = re.sub(r'\s+', ' ', t or '').strip()
        if not t or _looks_like_exercise(t) or t[:60].lower() in seen:
            continue
        if nepali != is_nepali(t[:400]) and len(passages) >= 2:
            continue
        seen.add(t[:60].lower())
        passages.append(t[:MAX_SOURCE_CHARS].rsplit(' ', 1)[0] if len(t) > MAX_SOURCE_CHARS else t)
        if len(passages) >= OPEN_MAX_SOURCES:
            break
    return passages


def open_answer(question: str, sources: list[dict], hits: list[dict] | None = None) -> dict:
    """Unverified fallback answer. Returns {'answer', 'ms', 'error'}; 'answer'
    is '' when the LLM is off or down, says it does not know, or writes
    nothing usable (e.g. English to a Nepali question)."""
    out = {'answer': '', 'ms': None, 'error': None}
    nepali = is_nepali(question)
    # The 0.5B model on the box writes broken Nepali ("| यसका अलावा चित्र 6."):
    # Nepali questions keep the "not found" reply (LOOMA_RAG_OPEN_NEPALI=1 to try).
    if not (LLM_ENABLED and OPEN_ENABLED) or (nepali and os.environ.get('LOOMA_RAG_OPEN_NEPALI') != '1'):
        return out
    passages = open_passages(question, sources, hits)
    body = {'messages': _open_prompt(question, passages, nepali), 'temperature': 0.2, 'top_k': 20,
            'max_tokens': OPEN_MAX_TOKENS, 'cache_prompt': True, 'repeat_penalty': 1.15, 'repeat_last_n': 64,
            'stop': ['\n\n', 'Question:', 'Passages:']}
    t0 = time.time()
    try:
        req = urllib.request.Request(LLM_URL + '/v1/chat/completions', data=json.dumps(body).encode('utf-8'),
                                     headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=LLM_TIMEOUT) as r:
            d = json.loads(r.read().decode('utf-8'))
        text = (d['choices'][0]['message'].get('content') or '').strip()
    except Exception as exc:
        out.update(ms=int((time.time() - t0) * 1000), error=str(exc)[:200])
        return out
    out['ms'] = int((time.time() - t0) * 1000)
    ans = _clean_open(text, question)
    if not ans or not _content(ans):
        return out
    if nepali and not mostly_nepali(ans):
        return out
    out['answer'] = ans
    return out
