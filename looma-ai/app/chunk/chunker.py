# chunk_size=400 (not 1200): the RAG embedding model
# (paraphrase-multilingual-MiniLM-L12-v2, see app/embed/model.py) has a hard
# max_seq_length of 128 tokens and SentenceTransformer.encode() truncates
# silently past it — no error, no warning surfaced to the caller. Measured
# against real English and Devanagari text, 1200 chars is ~180-190 tokens,
# so the embedding was built from only the first ~70-80% of every chunk and
# the rest was invisible to search no matter what was asked about it (cosine
# similarity between a chunk and that same chunk + an unrelated 250-char tail
# came out at 0.99999994 — the tail genuinely never reached the model). 400
# chars measures at 106-113 tokens for Nepali/English respectively, with
# margin under 128 for denser real-world text. overlap scaled down to match
# the original ~1:6 ratio.
def chunk_text(text: str, chunk_size=400, overlap=60):
    text = text.strip()
    if not text:
        return []

    chunks = []
    start = 0
    n = len(text)

    while start < n:
        end = min(start + chunk_size, n)

        if end < n:
            split_candidates = [
                text.rfind("\n\n", start, end),
                text.rfind(". ", start, end),
                text.rfind("\n", start, end),
            ]
            best = max(split_candidates)
            # Scaled to chunk_size (was a bare 200, calibrated for the old
            # 1200-char chunk_size — same ~1:6 ratio, so a natural break is
            # still only taken when it doesn't shrink the chunk by more than
            # ~83%, not just whenever one exists in a now much smaller window.
            if best > start + chunk_size // 6:
                end = best + 1

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= n:
            break

        start = max(end - overlap, start + 1)

    return chunks
