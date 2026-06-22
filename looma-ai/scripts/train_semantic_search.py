"""
Exercise the LOOMA semantic / hybrid search endpoint with queries
derived from the indexed content (chapters, subjects, grades).

Runs each query in fts / semantic / hybrid mode, captures latency and
hit counts, and writes a report to data/cache/train_semantic_search_report.json.

Usage:
    python scripts/train_semantic_search.py
    python scripts/train_semantic_search.py --base http://127.0.0.1:8089 --rounds 2 --limit 10
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


def http_get_json(url, timeout=30):
    req = urllib.request.Request(url, headers={'Accept': 'application/json'})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read()
    dt = time.time() - t0
    try:
        return json.loads(body.decode('utf-8')), dt
    except Exception:
        return {'_raw': body[:200].decode('utf-8', 'replace')}, dt


def build_queries_from_chapters(chapters, extra_seeds):
    queries = []
    seen = set()

    def add(q, tag, *, subject=None, grade=None):
        q = (q or '').strip()
        if not q or len(q) < 3:
            return
        key = (q.lower(), tag, subject, grade)
        if key in seen:
            return
        seen.add(key)
        queries.append({'q': q, 'tag': tag, 'subject': subject, 'grade': grade})

    for ch in chapters:
        title = (ch.get('chapter_title') or '').strip()
        if not title:
            continue
        clean = re.sub(r'\b(thumb|thumbnail|cover|page\s*\d+)\b', '', title, flags=re.I).strip()
        if clean:
            add(clean, 'chapter_title', subject=ch.get('subject'), grade=ch.get('grade_level'))
            words = [w for w in re.findall(r'[A-Za-zÀ-ÿ]{4,}', clean)]
            if len(words) >= 2:
                add(' '.join(words[:3]), 'chapter_keywords',
                    subject=ch.get('subject'), grade=ch.get('grade_level'))

    for seed in extra_seeds:
        add(seed, 'seed')

    return queries


SEED_QUERIES = [
    'algebra equations',
    'fractions and decimals',
    'photosynthesis',
    'water cycle',
    'parts of speech',
    'reading comprehension',
    'solar system planets',
    'simple machines',
    'human digestive system',
    'kingdom of nepal history',
    'multiplication tables',
    'geometry triangles',
    'verb tenses',
    'adjectives examples',
    'electricity circuits',
]


def run_search(base, query, mode, limit, *, subject=None, grade=None):
    params = {'q': query, 'mode': mode, 'limit': limit}
    if subject:
        params['subject'] = subject
    if grade:
        params['grade'] = grade
    url = base.rstrip('/') + '/search?' + urllib.parse.urlencode(params)
    try:
        data, dt = http_get_json(url, timeout=60)
        results = data.get('results') or []
        return {
            'ok': True,
            'mode_returned': data.get('mode', mode),
            'degraded_from': data.get('degraded_from'),
            'warning': data.get('warning'),
            'hits': len(results),
            'top_score': float(results[0]['hybrid_score']) if results else None,
            'top_title': results[0].get('chapter_title') if results else None,
            'top_file': results[0].get('file_name') if results else None,
            'latency_ms': round(dt * 1000, 1),
        }
    except Exception as exc:
        return {'ok': False, 'error': str(exc), 'latency_ms': None}


def main():
    parser = argparse.ArgumentParser(description='Train / exercise LOOMA semantic search.')
    parser.add_argument('--base', default='http://127.0.0.1:8089', help='LOOMA AI server base URL')
    parser.add_argument('--rounds', type=int, default=1, help='How many times to run the full query set')
    parser.add_argument('--limit', type=int, default=8, help='Results per query')
    parser.add_argument('--max-queries', type=int, default=80, help='Cap unique queries (after dedup)')
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--report', default='data/cache/train_semantic_search_report.json')
    args = parser.parse_args()

    random.seed(args.seed)
    base = args.base.rstrip('/')

    print(f'[semantic-train] base={base}')
    health, _ = http_get_json(base + '/health', timeout=10)
    print(f'[semantic-train] health: ok={health.get("ok")} ready={health.get("ready")}')

    chapters_data, _ = http_get_json(base + '/chapters?limit=500', timeout=30)
    chapters = chapters_data.get('chapters', [])
    print(f'[semantic-train] chapters indexed: {len(chapters)}')

    queries = build_queries_from_chapters(chapters, SEED_QUERIES)
    random.shuffle(queries)
    queries = queries[: args.max_queries]
    print(f'[semantic-train] generated {len(queries)} unique queries')

    modes = ['hybrid', 'semantic', 'fts']

    runs = []
    totals = {m: {'count': 0, 'hits_total': 0, 'lat_ms_total': 0.0, 'errors': 0, 'zero_hits': 0}
              for m in modes}

    t_start = time.time()
    for r in range(args.rounds):
        for i, qd in enumerate(queries, 1):
            for mode in modes:
                res = run_search(base, qd['q'], mode, args.limit,
                                 subject=qd.get('subject'), grade=qd.get('grade'))
                row = {'round': r + 1, 'i': i, 'mode': mode, **qd, **res}
                runs.append(row)
                t = totals[mode]
                t['count'] += 1
                if not res.get('ok'):
                    t['errors'] += 1
                    continue
                hits = int(res.get('hits') or 0)
                t['hits_total'] += hits
                if hits == 0:
                    t['zero_hits'] += 1
                t['lat_ms_total'] += float(res.get('latency_ms') or 0.0)

            if i % 10 == 0:
                print(f'[semantic-train] round {r+1} progress {i}/{len(queries)}')

    elapsed = time.time() - t_start

    summary = {
        'base': base,
        'queries_count': len(queries),
        'rounds': args.rounds,
        'elapsed_sec': round(elapsed, 2),
        'modes': {},
    }
    for mode, t in totals.items():
        n = max(t['count'], 1)
        summary['modes'][mode] = {
            'requests': t['count'],
            'errors': t['errors'],
            'zero_hit_queries': t['zero_hits'],
            'avg_hits': round(t['hits_total'] / n, 2),
            'avg_latency_ms': round(t['lat_ms_total'] / n, 1),
        }

    print('\n=== Semantic search training summary ===')
    print(json.dumps(summary, indent=2))

    out_path = Path(args.report)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps({'summary': summary, 'runs': runs}, indent=2), encoding='utf-8')
    print(f'\n[semantic-train] full report -> {out_path}')


if __name__ == '__main__':
    sys.exit(main() or 0)
