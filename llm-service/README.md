# looma-llm

Local LLM for the Looma AI Assistant: llama.cpp `llama-server`, built for the
ODROID-C4 (4× Cortex-A55, 3.6 GB RAM), listening on `127.0.0.1:8091`. Its only
client is looma-ai (`LOOMA_LLM_URL`).

## What it is for, and what it is not

The model never answers from its own knowledge. looma-ai
(`looma-ai/app/rag/answer.py`):

1. retrieves chunks from the `rag_chunks` zvec index (HNSW + BM25, fused),
   stitches each to its neighbours, and adds the encyclopedia article the
   question names (`app/rag/context.py`),
2. keeps at most three short excerpts around the sentences that are about the
   question's subject and have the shape of an answer; "What is X?" is
   answered by quoting the book's definition of X, without the model,
3. refuses to call the model at all when a key word of the question is in none
   of them ("Who was the first president of Nepal?" against passages about
   kings → *not found*),
4. asks the model to answer only from the numbered excerpts or say `NOT_FOUND`,
5. rejects the answer if any number or name in it is not in the excerpts, if
   more than a third of its words are not, or if it does not have the shape the
   question asks for (a date for *when*, a place for *where*, …),
6. falls back to quoting the best source sentence verbatim, or to *not found*.

Nepali questions skip the model and are answered by quoting: the small models
that fit this board write unreliable Nepali.

## Why a custom build

The C4 runs kernel 4.9, which does not advertise the `asimddp` hwcap, although
the A55 executes SDOT and FP16. The upstream image picks kernels by hwcap, so
on this board it runs plain ARMv8.0 code. `Dockerfile` compiles
`armv8.2-a+dotprod+fp16` in unconditionally.

Measured on the box (233-token RAG prompt, 4 threads, Q4_0):

| Model | Upstream image, prompt | This build, prompt | This build, idle box |
| --- | --- | --- | --- |
| Qwen2.5-0.5B-Instruct | 15.7 tok/s | 39.5 tok/s | 57.8 tok/s |
| Qwen2.5-1.5B-Instruct | 4.3 tok/s | 10.5 tok/s | 17.8 tok/s |

The first two columns were measured with the same background load (an index
build running); the last with nothing else running.

## Model choice

Measured on the box with the build above (233-token prompt, nothing else
running), and on the grounded-QA test set (16 who/what/when/where/why/how
questions, 5 of them unanswerable from the excerpts), with every check above:

| Model | Prompt | Generation | LLM time | Correct | Hallucinated |
| --- | --- | --- | --- | --- | --- |
| Qwen2.5-0.5B-Instruct Q4_0 (default) | 57.8 tok/s | 12.2 tok/s | 6.3 s | 14/16 | 0 |
| Qwen2.5-1.5B-Instruct Q4_0 | 17.8 tok/s | 4.3 tok/s | 22.3 s | 14/15* | 0 |

\* measured on the first 15 questions, with an earlier version of the checks.

The 0.5B is the default: the checks, not the model size, are what keep answers
grounded, and the 1.5B would be slower than the old extractive assistant
(~18 s). Use the 1.5B with `LLM_MODEL_FILE`/`LLM_MODEL_URL` on a faster board.

End to end on the box (retrieval + LLM + checks), measured with
`looma-ai/scripts/eval_answers.py` on 2026-11-10 (82 questions; a quarter of
them cannot be answered from Looma's content, and must get "not found"):

| Set | Before | After | Invented facts (after) | Median / worst (after) |
| --- | --- | --- | --- | --- |
| English, 38 questions | 23 | 32 | 0 | 4.6 s / 12.5 s |
| English, 26 held-out questions | – | 13 | 0 | 5.9 s / 12.4 s |
| Nepali, 10 questions | – | 7 | 0 | 1.1 s / 3.6 s |
| Nepali, 8 held-out questions | – | 3 | 0 | 1.9 s / 7.4 s |

"Before" is the version of 2026-11-09, which also answered "Why did Buddha play
football?" with a sentence about basketball and "When did the Rana regime
end?" with 1972. Most remaining misses are "not found" where the box has no
sentence that states the answer. "What is X?" is now answered by quoting the
book's definition, without the model. The held-out sets were written after the
checks were tuned. Read the answers, not only the scores: the script counts
keywords.

Second round, same day (definition search, lead sentences, precision rules;
see README-ZVEC.txt). Box before → after, plus two sets written later:

| Set | Before | After | Invented facts (after) |
| --- | --- | --- | --- |
| English, 38 | 32 | 32 | 0 |
| English held-out, 26 | 13 | 18 | 0 |
| English v3, 30 (written before this round) | 18 | 20 | 0 |
| English v4, 30 (written after; 1 bug found with it, then fixed) | 21, 1 invented | 22 | 0 |
| Nepali, 34 in four sets | 21 | 21 (2 more correct in other spellings) | 0 |

"Before" on v4 answered "Who was the first king of the Moon?" with "Frank
Borman". Some "before" misses were wrong quotes rather than "not found"
(Brazil as the largest country in the world, K2 as the highest mountain, a
refugee count for when World War II ended); they are now "not found".

## Fine-tuning (tried, not deployed)

A LoRA fine-tune of the same Qwen2.5-0.5B was trained on 2026-11-10 to copy
the answering sentence from the excerpts, or say NOT_FOUND
(`~/looma-train` on the dev PC: questions written by Qwen2.5-3B from box
passages, filtered through looma-ai's own retrieval and checks; 615 examples;
converted to Q4_0 with the box model's own GGUF metadata). On 72 held-out
excerpt sets it went from 3/51 to 29/51 correct quotes, 0/21 to 16/21
NOT_FOUND, and 24 to 0 replies with words not in the excerpts. End to end it
tied the stock model (it picks a wrong sentence more often, and the checks
already removed the stock model's inventions), so the stock model stays.

A second round (2026-11-10/11) used better data: Qwen2.5-7B (partly on the dev
PC's GTX 1650) wrote 2,153 student-style questions and 1,500 questions from
single sentences, and labelled the sentence that answers each one *in the
excerpts the box really retrieves*, kept only when it picked the same sentence
twice. On 120 held-out excerpt sets the student (v5) picks the answering
sentence 53/74 times (stock: 2/74) with 0 invented words (stock: 39 replies).
End to end on the 124 English eval questions it still ties the stock model
(92/124). v3/v4 said NOT_FOUND to "Buddha was born in 623 BC in Lumbini" (the
teacher's NONE labels were too strict); v5 fixed that but often copies the
first sentence of an excerpt ("Buddha Jayanti is a festival ..."). A MiniLM
cross-encoder trained on the same labels picks the right sentence 69/74 times,
but did not help end to end either (91/124): most remaining misses are
questions the books do not answer in one sentence, or answers the
anti-invention checks rightly refuse to quote. The LLM is no longer the
bottleneck; content coverage and the checks are.

v5 is installed on the box (2026-11-11) as
`looma_llm_models:/looma-qwen0.5b-v5-q4_0.gguf` (`docker-compose.native.yml`
on the box points at it; the repo copy and the installer still fetch the stock
model, since v5 is not downloadable). Box eval with v5: English 91/124 (stock
92), Nepali unchanged (21/34), 0 invented facts; medians 4.6–6.3 s (stock
3.4–6.7 s), answers are whole quoted sentences. Rollback on the box: the stock
model is still in the volume, `docker-compose.native.yml.pre-v5` is the old
compose file, and the old container is kept, stopped, as `looma-llm-pre-v5`.

Gemma-3-1B and Qwen3-0.6B were tried and dropped: Gemma misattributed facts
between excerpts; Qwen3 spent its token budget thinking.

## Run

```bash
docker build -t looma-llm:latest llm-service/          # on the box, ~40 min
docker run -d --name looma-llm --network host \
  -v looma_llm_models:/models:ro looma-llm:latest \
  -m /models/<model>.gguf --host 127.0.0.1 --port 8091 -t 4 -c 2048 -np 1 --no-webui
curl -s http://127.0.0.1:8091/health
```

The installer (`deploy/odroid/looma-installer.sh`) does this as the `looma-llm`
service of `docker-compose.native.yml` and fetches the model into the
`looma_llm_models` volume (`LLM_MODEL_FILE`, `LLM_MODEL_URL`).

Turn the model off without touching the rest: `LOOMA_LLM=0` on looma-ai. The
assistant then quotes sources.
