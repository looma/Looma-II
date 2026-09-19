"""Extractive question answering: pull the exact answer SPAN out of a chunk
of text, instead of _compose_answer's token-overlap sentence picking.

_compose_answer (looma_server.py) scores whole sentences by word overlap with
the question — "where is Portugal?" scores any sentence containing the word
"Portugal" roughly the same, so a sentence that only MENTIONS Portugal in
passing (e.g. "Portuguese is taught in Uruguay and Argentina") can outscore
the one that actually answers the question. A span-extraction model reads the
question and the candidate text together and predicts which substring answers
it, which is a fundamentally different (and much more precise) judgment than
word overlap.

This deliberately is NOT a generative model. no LLM call — same reasoning as
generate_assets.py's rule-based exam generator: the odroid boxes this runs on
have no GPU and as little as ~2GB free RAM shared with several other
services, so anything that has to hold a decoder LLM's weights and KV cache
is a real stability risk. A SQuAD-style extractive model answers in one
forward pass and only ever repeats words already in the given text, so it
can't hallucinate content that isn't there — the same safety property
_compose_answer already had, with much better precision.

Model: deepset/xlm-roberta-base-squad2, quantized to ONNX int8 (see
deploy/odroid/build-qa-model.py) — 278MB, not the 855MB a naive PyTorch
dynamic-quantization would give: dynamic quantization only quantizes
nn.Linear layers, and 69% of this model's parameters are the multilingual
vocabulary's embedding table, which dynamic quantization can't touch. ONNX's
quantizer does quantize it. Shipped as a prebuilt artifact (see
QA_MODEL_DIR in app/paths.py) rather than quantized on the box, since
quantizing needs the ~1.1GB fp32 model in memory even transiently.
"""
import os
from functools import lru_cache

DISABLE_QA = (os.environ.get('LOOMA_DISABLE_QA') or '').strip() in {'1', 'true', 'yes'}

# Below this score the model is telling us its best span isn't confident
# (SQuAD2's own no-answer/CLS score often outscores a weak real span) — fall
# back to _compose_answer instead of returning a low-confidence extraction.
MIN_SCORE = float(os.environ.get('LOOMA_QA_MIN_SCORE', '6.0'))
MAX_ANSWER_TOKENS = 30
MAX_SEQ_LEN = 384


@lru_cache(maxsize=1)
def _load():
    from app.paths import QA_MODEL_DIR

    if DISABLE_QA or not QA_MODEL_DIR.exists():
        return None
    try:
        # Lazy import, same reason as app/embed/model.py: keep the server
        # able to start (FTS-only / sentence-picking-only) even where
        # onnxruntime/optimum aren't installed or don't run on the CPU.
        from optimum.onnxruntime import ORTModelForQuestionAnswering  # noqa: WPS433
        from transformers import AutoTokenizer  # noqa: WPS433

        tokenizer = AutoTokenizer.from_pretrained(str(QA_MODEL_DIR))
        model = ORTModelForQuestionAnswering.from_pretrained(
            str(QA_MODEL_DIR), file_name='model_quantized.onnx',
        )
    except Exception:
        return None
    return tokenizer, model


def extract_answer(question: str, context: str):
    """Best (question, context) answer span, or None if unavailable/unconfident.

    Returns {'answer': str, 'score': float} — 'answer' is always a verbatim
    substring of `context` (or a small superset via the offset mapping), so
    this can never introduce text that wasn't already in the retrieved chunk.
    """
    loaded = _load()
    if loaded is None or not question or not context:
        return None
    tokenizer, model = loaded

    try:
        encoded = tokenizer(
            question, context,
            return_offsets_mapping=True, return_tensors='pt',
            truncation='only_second', max_length=MAX_SEQ_LEN,
        )
        offsets = encoded.pop('offset_mapping')[0].tolist()
        sequence_ids = encoded.sequence_ids(0)
        model_inputs = {k: v for k, v in encoded.items() if k in ('input_ids', 'attention_mask')}
        output = model(**model_inputs)
        start_logits = output.start_logits[0]
        end_logits = output.end_logits[0]
    except Exception:
        return None

    context_positions = [i for i, seq in enumerate(sequence_ids) if seq == 1]
    if not context_positions:
        return None

    # Index 0 is always <s> (CLS-equivalent) — SQuAD2 models are trained to
    # point start AND end there when the context doesn't answer the question.
    no_answer_score = (start_logits[0] + end_logits[0]).item()

    best_span = None
    best_score = no_answer_score
    for start in context_positions:
        for end in context_positions:
            if end < start or end - start > MAX_ANSWER_TOKENS:
                continue
            score = (start_logits[start] + end_logits[end]).item()
            if score > best_score:
                best_score = score
                best_span = (start, end)

    if best_span is None or best_score < MIN_SCORE:
        return None

    start, end = best_span
    answer = context[offsets[start][0]:offsets[end][1]].strip()
    if not answer:
        return None
    return {'answer': answer, 'score': best_score}
