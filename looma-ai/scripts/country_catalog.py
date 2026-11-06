"""Per-country curriculum catalog: for a given country, which grade x
subject combinations exist, from which source, and how much content backs
each one. This is step 2 of the country/curriculum plan (see
export_country_build.py for step 3, the per-box export that reads this same
data) -- it does not change anything, it only reports what is there.

Two sources of "this chapter exists":
  1. Mongo `chapters` (ch_id-keyed, e.g. "5M01" = grade 5, Mathematics,
     chapter 01 -- see js/looma-utilities.js's LOOMA.CH_IDregex). This is
     Nepal's official curriculum structure; it predates this project's
     country/curriculum work and carries no country field of its own, so it
     is only consulted when --country Nepal is asked for.
  2. SQLite `documents`/`chapters` (looma-ai's own index, schema.sql) --
     every document ingested with `ingest_looma.py --country X` lands here
     tagged accordingly. This is what a second country's official
     curriculum will show up under once it is ingested.

Usage:
    python3 scripts/country_catalog.py --country Nepal
    python3 scripts/country_catalog.py --country Senegal --json /tmp/senegal.json
"""
import argparse
import json
import os
import re
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.paths import SQLITE_DB_PATH  # noqa: E402
from pymongo import MongoClient  # noqa: E402

GRADES = list(range(1, 13))

# Best-effort full names for CLAUDE.md's subject-code convention. An unknown
# code (there will be one eventually) just prints as-is -- never an error.
SUBJECT_NAMES = {
    'EN': 'English', 'ENa': 'English (additional)',
    'M': 'Mathematics', 'Ma': 'Mathematics (additional)',
    'S': 'Science', 'Sa': 'Science (additional)', 'SF': 'Science (SF)',
    'SS': 'Social Studies', 'SSa': 'Social Studies (additional)',
    'N': 'Nepali', 'H': 'Health', 'V': 'Value Education', 'CS': 'Computer Science',
}

# From js/looma-utilities.js LOOMA.CH_IDregex, anchored (that copy is
# deliberately unanchored so it can match mid-string; here we want a strict
# whole-id match so an unrelated-looking _id can't be miscounted).
CH_ID_RE = re.compile(r'^([1-9]|10|11|12)(EN|ENa|Sa|S|SF|Ma|M|SSa|SS|N|H|V|CS)(\d{2})(\.(\d{2}))?$')

# Mongo's `chapters` collection IS Nepal's official curriculum structure --
# see the module docstring. Update this (or generalize to a real per-country
# field in Mongo) once a second country's curriculum is ingested the same
# ch_id-keyed way rather than through ingest_looma.py's SQLite path.
NEPAL_IS_MONGO_CHAPTERS = 'Nepal'


def mongo_catalog(mongo_url, mongo_db):
    """Returns (by_grade_subject dict, unmatched_count) or (None, error_str)."""
    try:
        client = MongoClient(mongo_url, serverSelectionTimeoutMS=3000)
        rows = list(client[mongo_db]['chapters'].find({}, {'_id': 1}))
    except Exception as e:
        return None, str(e)
    by_grade_subject = defaultdict(list)
    unmatched = 0
    for r in rows:
        m = CH_ID_RE.match(r['_id'])
        if not m:
            unmatched += 1
            continue
        grade = int(m.group(1))
        subj = m.group(2)
        by_grade_subject[(grade, subj)].append(r['_id'])
    return by_grade_subject, unmatched


def sqlite_catalog(db_path, country):
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        """
        SELECT d.grade_level AS grade_level, d.subject AS subject,
               COUNT(DISTINCT d.id) AS docs,
               COUNT(DISTINCT c.id) AS chapters,
               COUNT(ch.id) AS chunks
        FROM documents d
        LEFT JOIN chapters c ON c.document_id = d.id
        LEFT JOIN chunks ch ON ch.document_id = d.id
        WHERE d.country = ?
        GROUP BY d.grade_level, d.subject
        """, (country,)
    ).fetchall()
    universal = conn.execute(
        """
        SELECT COUNT(DISTINCT d.id) AS docs, COUNT(ch.id) AS chunks
        FROM documents d LEFT JOIN chunks ch ON ch.document_id = d.id
        WHERE d.country IS NULL
        """
    ).fetchone()
    conn.close()
    return rows, universal


def build_arg_parser():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--country', required=True, help='e.g. "Nepal", "Senegal"')
    p.add_argument('--mongo-url', default=os.environ.get('LOOMA_MONGO_URL', 'mongodb://looma-db:27017'))
    p.add_argument('--mongo-db', default=os.environ.get('LOOMA_MONGO_DB', 'looma'))
    p.add_argument('--source-db', type=Path, default=None,
                    help='SQLite looma.db path (default: this box\'s own, app.paths.SQLITE_DB_PATH)')
    p.add_argument('--json', type=Path, default=None,
                    help='Also write the full manifest as JSON to this path')
    return p


def main():
    args = build_arg_parser().parse_args()
    db_path = args.source_db or SQLITE_DB_PATH

    print(f'=== Curriculum catalog: {args.country} ===\n')
    manifest = {'country': args.country, 'grades': {}}

    mongo_data = None
    if args.country == NEPAL_IS_MONGO_CHAPTERS:
        mongo_data, info = mongo_catalog(args.mongo_url, args.mongo_db)
        if mongo_data is None:
            print(f'[warn] could not reach Mongo `chapters`: {info}\n')
        else:
            total = sum(len(v) for v in mongo_data.values())
            print(f'Mongo `chapters` (official Nepal curriculum, ch_id-keyed): '
                  f'{total} chapters matched, {info} unmatched _id\n')

    sqlite_rows, universal = sqlite_catalog(db_path, args.country)
    sqlite_by_gs = {(r['grade_level'], r['subject']): r for r in sqlite_rows
                     if r['grade_level'] is not None and r['subject']}
    print(f'SQLite documents tagged country={args.country}: '
          f'{len(sqlite_by_gs)} grade/subject combinations, '
          f'{sum(r["docs"] for r in sqlite_rows)} documents total')
    print(f'Universal/supplementary content (country IS NULL -- OpenStax, Wikipedia, '
          f'MIT OCW, ... available to every box regardless of country): '
          f'{universal["docs"]} documents, {universal["chunks"]} chunks\n')

    header = f'{"Grade":<6}{"Subject":<24}{"Mongo ch_ids":<13}{"SQLite docs":<12}{"Chunks":<10}{"Status"}'
    print(header)
    print('-' * len(header))
    any_gap = False
    for grade in GRADES:
        subjects_seen = set()
        if mongo_data:
            subjects_seen |= {s for (g, s) in mongo_data if g == grade}
        subjects_seen |= {s for (g, s) in sqlite_by_gs if g == grade}
        if not subjects_seen:
            print(f'{grade:<6}{"(nothing registered for this grade)":<24}')
            any_gap = True
            manifest['grades'][grade] = {}
            continue
        grade_manifest = {}
        for subj in sorted(subjects_seen):
            mongo_n = len(mongo_data.get((grade, subj), [])) if mongo_data else 0
            row = sqlite_by_gs.get((grade, subj))
            sqlite_docs = row['docs'] if row else 0
            chunks = row['chunks'] if row else 0
            status = 'OK' if (mongo_n or sqlite_docs) else 'MISSING'
            any_gap = any_gap or (status == 'MISSING')
            name = SUBJECT_NAMES.get(subj, subj)
            print(f'{grade:<6}{name:<24}{mongo_n:<13}{sqlite_docs:<12}{chunks:<10}{status}')
            grade_manifest[subj] = {
                'subject_name': name, 'mongo_chapter_count': mongo_n,
                'sqlite_document_count': sqlite_docs, 'chunk_count': chunks, 'status': status,
            }
        manifest['grades'][grade] = grade_manifest

    if any_gap:
        print('\nSome grade/subject combinations have no registered content for this country yet.')
    else:
        print('\nEvery grade 1-12 has at least one subject with content.')

    if args.json:
        args.json.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')
        print(f'\nWrote manifest to {args.json}')


if __name__ == '__main__':
    main()
