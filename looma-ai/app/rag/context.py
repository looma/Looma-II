"""Turn retrieved chunks into readable passages for the answer step.

Chunks are ~400 characters and cut sentences in half ("…plants is called
photosynthesis."). An answer can only be as good as the sentence it is built
from, so before answering:

  expand()         stitches each hit to its neighbouring chunks (same page, or
                   the page boundary), removing the overlap between them, so
                   the sentence that holds the answer is whole.
  topic_article()  when the question names something that has its own
                   encyclopedia article in the box ("Where is Mount Everest?"
                   -> W4S2013 "Mount Everest"), adds that article's opening
                   paragraph: it states what the thing is, where, and when.

Chunk ids are "<document_id>_p<page>_c<index>", so neighbours are primary-key
lookups (no extra index on the 1.1 M-row chunks table).
"""

from __future__ import annotations

import re

_ID = re.compile(r'^(?P<doc>.+)_p(?P<page>\d+)_c(?P<idx>\d+)$')

# Reference tiers first: the 2013 Schools Wikipedia replaced the 2007 one.
_ARTICLE_ROOTS = ('/W4S2013/wp/', '/W4S/wp/')
LEAD_CHUNKS = 10
_LEAD_CHARS = 1800

_LEADING = re.compile(
    r"^(who|what|when|where|why|how|which|whom|whose|is|are|was|were|do|does|did|can|could|"
    r"tell|me|about|explain|describe|define|the|a|an|many|much|long|high|far|old|big|"
    r"meaning|of|definition)$")
_EDGE_STOP = {'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'is', 'are', 'was', 'were',
              'do', 'does', 'did', 'there', 'by', 'from', 'with', 'its', 'it', 'his', 'her', 'their', 'what',
              'who', 'when', 'where', 'why', 'how', 'which', 'many', 'much', 'first', 'called', 'known'}


def _norm(t: str) -> str:
    return re.sub(r'\s+', ' ', t or '').strip()


def stitch(a: str, b: str, *, keep_lines: bool = False) -> str:
    """Join two consecutive chunks, dropping the text they share."""
    if not keep_lines:
        a, b = _norm(a), _norm(b)
    if not a:
        return b
    if not b:
        return a
    for k in range(min(len(a), len(b), 400), 11, -1):
        if a.endswith(b[:k]):
            return a + b[k:]
    return a + ' ' + b


def _page_rows(conn, doc: str, page: int) -> list[tuple[int, str]]:
    lo = f'{doc}_p{page}_c'
    rows = conn.execute('SELECT chunk_index, clean_text FROM chunks WHERE id >= ? AND id < ?',
                        (lo, lo[:-1] + 'd')).fetchall()
    return sorted((int(r[0]), r[1] or '') for r in rows)


def expand(conn, hits: list[dict], *, before: int = 1, after: int = 1) -> list[dict]:
    """Replace each hit's text with the chunk plus its neighbours, stitched.
    The original chunk text is kept as hit['chunk_text']."""
    for h in hits:
        m = _ID.match(str(h.get('id') or ''))
        if not m or h.get('chunk_text') is not None:
            continue
        doc, page, idx = m.group('doc'), int(m.group('page')), int(m.group('idx'))
        try:
            rows = _page_rows(conn, doc, page)
            pos = next((i for i, (ci, _) in enumerate(rows) if ci == idx), None)
            if pos is None:
                continue
            parts = [t for _, t in rows[max(0, pos - before):pos + after + 1]]
            # A sentence that runs across a page break.
            if pos == 0 and before:
                prev = _page_rows(conn, doc, page - 1)
                if prev:
                    parts.insert(0, prev[-1][1])
            if pos + after >= len(rows) and after:
                nxt = _page_rows(conn, doc, page + 1)
                if nxt:
                    parts.append(nxt[0][1])
        except Exception:
            continue
        text = ''
        for p in parts:
            text = stitch(text, p)
        h['chunk_text'] = h.get('text')
        h['text'] = text
    return hits


def topic_spans(question: str) -> list[str]:
    """Candidate article titles named in the question, longest first:
    "What is the boiling point of water?" -> ['boiling point of water',
    'boiling point', 'point of water', ..., 'water']."""
    words = re.findall(r"[A-Za-z][A-Za-z'\-]*", question or '')
    lw = [w.lower() for w in words]
    i = 0
    while i < len(lw) and _LEADING.match(lw[i]):
        i += 1
    lw = lw[i:]
    spans = []
    for n in range(min(4, len(lw)), 0, -1):
        for s in range(len(lw) - n, -1, -1):          # later spans first: "function of the heart" -> heart
            span = lw[s:s + n]
            if span[0] in _EDGE_STOP or span[-1] in _EDGE_STOP or len(''.join(span)) < 3:
                continue
            spans.append(' '.join(span))
    out = []
    for sp in spans:
        for v in (sp, sp[:-1] if sp.endswith('s') and not sp.endswith('ss') and len(sp) > 4 else None):
            if v and v not in out:
                out.append(v)
    return out


_BOILER_END = re.compile(r'sponsoring a child|sponsor a child[^.]*\.|Schools selection[^.]*\.', re.I)


def topic_article(conn, question: str) -> dict | None:
    """The opening paragraph of the encyclopedia article the question is about,
    as {'title', 'chunk_id', 'text'}; None when the question names no article."""
    spans = topic_spans(question)
    if not spans:
        return None
    marks = ','.join('?' * len(spans))
    rows = conn.execute(
        f'SELECT id, lower(title) AS t, source_path FROM documents WHERE lower(title) IN ({marks})', spans,
    ).fetchall()
    best = None
    for doc_id, t, sp in rows:
        root = next((k for k, r in enumerate(_ARTICLE_ROOTS) if r in (sp or '')), None)
        if root is None or '/wp/index/' in sp:
            continue
        key = (spans.index(t), root)
        if best is None or key < best[0]:
            best = (key, doc_id, t)
    if best is None:
        return None
    _, doc_id, title = best
    rows = _page_rows(conn, doc_id, 1)[:LEAD_CHUNKS]
    if not rows:
        return None
    text = ''
    for _, t in rows:
        text = stitch(text, t or '')
    # Skip the "Related subjects ... sponsoring a child" banner, then start at
    # the article's first sentence about its subject ("Mount Everest (Nepali:
    # ...) is the Earth's highest mountain"); the infobox comes before it.
    ends = [m.end() for m in _BOILER_END.finditer(text[:1500])]
    if ends:
        text = text[ends[-1]:]
    # Names in other scripts and pronunciations: "(Nepali: सगरमाथा; Tibetan: ...)".
    text = re.sub(r'\s*\((?=[^()]*(?::|[^\x00-\x7f]))[^()]{0,600}\)', '', text)
    name = r'\b' + r'\s+'.join(re.escape(w) for w in title.split()) + r's?\b'
    # The lead sentence: the title, at most an aside ("(born 1914)", ", also
    # called X,"), then the verb. A loose match (anything up to "is") would
    # stop inside the navigation lists that come first on many pages.
    aside = r'\s*(?:\([^()]{0,200}\)\s*)?(?:,[^,.]{0,120},\s*)?(?:is|are|was|were|refers)\b'
    # A person's article starts with the full name: "Mahatma Gandhi" ->
    # "Mohandas Karamchand Gandhi (...) was ...".
    last = re.escape(title.split()[-1].capitalize())
    m = (re.search(name + aside, text, re.I)
         or (re.search(r'\b(?:[A-Z][\w.\-]*\s+){1,3}' + last + aside, text) if len(title.split()) > 1 else None)
         or re.search(name + r'[^.]{0,400}?\b(?:is|are|was|were|refers)\b', text, re.I))
    if m:
        start = m.start()
        pre = re.search(r'\b(The|An|A)\s+$', text[max(0, start - 5):start])
        text = text[start - len(pre.group(0)) if pre else start:]
    text = _norm(text)
    text = re.sub(r'\s+([,.;:])', r'\1', text).replace(" 's", "'s")
    text = text[:_LEAD_CHARS]
    if len(text) < 80:
        return None
    return {'title': title, 'chunk_id': f'{doc_id}_p1_c{rows[0][0]}', 'text': text}
