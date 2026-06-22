"""
Exercise the LOOMA RAG (AI conversation) endpoint with multi-turn
dialogues built from indexed chapters.

For each chapter sample, runs an opening question + follow-ups,
keeping conversation history. Captures answer length, retrieved
context counts and latency. Writes a JSON transcript and summary.

Usage:
    python scripts/train_rag_conversation.py
    python scripts/train_rag_conversation.py --base http://127.0.0.1:8089 --chapters 10 --turns 3
"""

import argparse
import json
import random
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path


def http_request(method, url, payload=None, timeout=120):
    headers = {'Accept': 'application/json'}
    data = None
    if payload is not None:
        data = json.dumps(payload).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read()
    dt = time.time() - t0
    try:
        return json.loads(body.decode('utf-8')), dt
    except Exception:
        return {'_raw': body[:300].decode('utf-8', 'replace')}, dt


GENERIC_FOLLOWUPS = [
    'Can you explain that more simply for a young student?',
    'Give me a real-world example.',
    'What are the key terms I should remember?',
    'Summarize the main idea in one sentence.',
    'What questions could a teacher ask about this?',
]

# Short, keyword-leaning openers — the RAG retriever (FTS + ZVEC hybrid)
# performs best when the question contains rare topical tokens that appear
# in indexed chunks. Long natural-language questions miss too often.
TOPIC_OPENERS = [
    'photosynthesis',
    'water cycle',
    'fractions',
    'noun and verb',
    'parts of a plant',
    'solar system',
    'gravity',
    'addition',
    'multiplication',
    'human heart',
    'food groups',
    'simple machines',
    'rocks and minerals',
    'electricity circuit',
    'parts of speech',
    'reading comprehension',
]


SUBJECT_TOPICS = {
    'english': ['the alphabet', 'reading comprehension', 'verbs', 'storytelling', 'phonics'],
    'math': ['addition', 'subtraction', 'shapes', 'numbers', 'patterns', 'measurement'],
    'science': ['plants', 'the human body', 'weather', 'animals', 'matter'],
}


def opening_question(chapter):
    title = (chapter.get('_clean_title') or '').strip()
    subj = (chapter.get('subject') or '').strip().lower()

    # Code-style titles ("1EN01.06") aren't useful as a question subject —
    # fall back to a topic-rich opener that's likely to retrieve content.
    if chapter.get('_codey_title') or len(title) < 4:
        return random.choice(TOPIC_OPENERS)

    if subj:
        return f'What is "{title}" in {subj}, and why does it matter?'
    return f'Explain "{title}" to me clearly.'


def clean_chapter_title(title):
    if not title:
        return ''
    t = re.sub(r'\b(thumb|thumbnail|cover|page\s*\d+)\b', '', title, flags=re.I)
    return re.sub(r'\s+', ' ', t).strip()


def main():
    parser = argparse.ArgumentParser(description='Train / exercise LOOMA RAG conversations.')
    parser.add_argument('--base', default='http://127.0.0.1:8089')
    parser.add_argument('--chapters', type=int, default=8, help='How many chapters to converse about')
    parser.add_argument('--turns', type=int, default=3, help='Total turns per chapter (1 opening + N-1 follow-ups)')
    parser.add_argument('--topk', type=int, default=6)
    parser.add_argument('--seed', type=int, default=7)
    parser.add_argument('--report', default='data/cache/train_rag_conversation_report.json')
    parser.add_argument('--engine', default='zvec', choices=['zvec', 'mongo'])
    parser.add_argument('--mode', default='hybrid', choices=['hybrid', 'semantic', 'fts'])
    parser.add_argument('--scope-to-chapter', action='store_true',
                        help='Filter retrieval by the chapter subject/grade (off by default — yields more hits).')
    args = parser.parse_args()

    random.seed(args.seed)
    base = args.base.rstrip('/')

    print(f'[rag-train] base={base}')
    health, _ = http_request('GET', base + '/health', timeout=10)
    print(f'[rag-train] health: ok={health.get("ok")} ready={health.get("ready")}')

    chapters_data, _ = http_request('GET', base + '/chapters?limit=2000', timeout=30)
    chapters = chapters_data.get('chapters', [])
    valid = []
    for c in chapters:
        t = clean_chapter_title(c.get('chapter_title'))
        if not t or len(t) < 3:
            continue
        is_codey = bool(re.match(r'^\d?[A-Z]{1,3}\d', t))
        c2 = dict(c)
        c2['_clean_title'] = t
        c2['_codey_title'] = is_codey
        valid.append(c2)
    if not valid:
        print('[rag-train] No usable chapters found.')
        return 1

    # Prefer chapters with subject + grade metadata — they're more likely to
    # have real chunked content behind them.
    with_meta = [c for c in valid if c.get('subject') and c.get('grade_level')]
    without_meta = [c for c in valid if not (c.get('subject') and c.get('grade_level'))]
    random.shuffle(with_meta)
    random.shuffle(without_meta)
    selected = (with_meta + without_meta)[: args.chapters]
    print(f'[rag-train] conversing about {len(selected)} chapters (turns={args.turns})')

    transcripts = []
    totals = {
        'turns': 0,
        'errors': 0,
        'empty_answers': 0,
        'answer_chars_total': 0,
        'context_count_total': 0,
        'lat_ms_total': 0.0,
    }

    t_start = time.time()
    for ci, ch in enumerate(selected, 1):
        history = []
        convo = {
            'chapter_id': ch.get('chapter_id'),
            'chapter_title': ch.get('chapter_title'),
            'subject': ch.get('subject'),
            'grade': ch.get('grade_level'),
            'turns': [],
        }

        question = opening_question(ch)
        for ti in range(args.turns):
            payload = {
                'question': question,
                'engine': args.engine,
                'mode': args.mode,
                'topk': args.topk,
                'history': history,
                'include_contexts': True,
            }
            # Don't pass subject/grade/chapter_id filters: in the current index
            # most chapters carry only stub content, so filtered retrieval
            # collapses to zero hits. Leave the RAG endpoint to search broadly.
            if args.scope_to_chapter and ch.get('subject') and ch.get('grade_level'):
                payload['subject'] = ch['subject']
                payload['grade'] = ch['grade_level']

            try:
                resp, dt = http_request('POST', base + '/rag_query', payload=payload, timeout=180)
                answer = (resp.get('answer') or '').strip()
                contexts = resp.get('contexts') or []
                ok = bool(resp.get('ok', True)) and bool(answer)
                row = {
                    'turn': ti + 1,
                    'question': question,
                    'answer': answer,
                    'context_count': len(contexts),
                    'first_context_title': (contexts[0].get('chapter_title') if contexts else None),
                    'latency_ms': round(dt * 1000, 1),
                    'ok': ok,
                    'error': resp.get('error'),
                }
                convo['turns'].append(row)

                totals['turns'] += 1
                totals['lat_ms_total'] += row['latency_ms'] or 0.0
                totals['context_count_total'] += row['context_count']
                totals['answer_chars_total'] += len(answer)
                if not ok:
                    totals['errors'] += 1
                if not answer:
                    totals['empty_answers'] += 1

                history = history + [{'role': 'user', 'content': question}]
                if answer:
                    history.append({'role': 'assistant', 'content': answer})
                history = history[-10:]

                if ti + 1 < args.turns:
                    question = random.choice(GENERIC_FOLLOWUPS)
            except Exception as exc:
                convo['turns'].append({
                    'turn': ti + 1,
                    'question': question,
                    'error': str(exc),
                    'ok': False,
                })
                totals['turns'] += 1
                totals['errors'] += 1
                break

        transcripts.append(convo)
        a0 = (convo['turns'][0].get('answer') or '')[:140].replace('\n', ' ') if convo['turns'] else ''
        print(f"[rag-train] [{ci}/{len(selected)}] {ch['_clean_title'][:40]!r} -> {a0!r}")

    elapsed = time.time() - t_start

    n = max(totals['turns'], 1)
    summary = {
        'base': base,
        'chapters_conversed': len(selected),
        'turns_per_chapter': args.turns,
        'elapsed_sec': round(elapsed, 2),
        'turns_total': totals['turns'],
        'errors': totals['errors'],
        'empty_answers': totals['empty_answers'],
        'avg_answer_chars': round(totals['answer_chars_total'] / n, 1),
        'avg_contexts_per_turn': round(totals['context_count_total'] / n, 2),
        'avg_latency_ms': round(totals['lat_ms_total'] / n, 1),
    }

    print('\n=== RAG conversation training summary ===')
    print(json.dumps(summary, indent=2))

    out_path = Path(args.report)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps({'summary': summary, 'transcripts': transcripts}, indent=2),
                        encoding='utf-8')
    print(f'\n[rag-train] full transcripts -> {out_path}')
    return 0


if __name__ == '__main__':
    sys.exit(main() or 0)
