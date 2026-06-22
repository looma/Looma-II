import argparse
import hashlib
import os
import re
from pathlib import Path


import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))
from tqdm import tqdm

from app.extract.text_extractors import extract_any
from app.extract.text_extractors import _looks_like_scanned_or_empty as looks_like_scanned_or_empty
from app.utils.clean import clean_text
from app.chunk.chunker import chunk_text
from app.embed.model import load_model
from app.index.sqlite_store import get_conn, upsert_document, replace_chapters, replace_chunks, commit

try:
    import zvec
    from app.index.zvec_store import open_curriculum_chunks, insert_curriculum_docs
except Exception:
    zvec = None
    open_curriculum_chunks = None
    insert_curriculum_docs = None


DEFAULT_ROOT = Path(os.environ.get('LOOMA_SOURCE_ROOT', 'data/raw/looma'))

SUPPORTED = {
    # Standard document formats.
    '.pdf',
    '.docx',
    '.pptx',
    '.txt',
    '.md',
    '.html',
    '.htm',
    '.vtt',
    # Looma-native curriculum metadata that lives next to chapter PDFs in
    # content/chapters. These are plain-text / Markdown files that carry
    # chapter summaries, outlines, quizzes and lesson plans — they are exactly
    # the kind of high-signal short text the semantic search needs.
    '.summary',
    '.outline',
    '.quiz',
    '.objectives',
    '.plan',
    '.lesson',
    # JSON-shaped Looma content: vocabulary lists (.keywords) and map feature
    # collections (.geojson) — handled by dedicated extractors that flatten
    # the JSON into searchable text.
    '.keywords',
    '.geojson',
    # OCR'ed images. Off by default (--include-images) because content/ has
    # tens of thousands of decorative / asset images.
    '.png',
    '.jpg',
    '.jpeg',
    '.tif',
    '.tiff',
    '.bmp',
    '.webp',
}

IMAGE_SUFFIXES = {
    '.png',
    '.jpg',
    '.jpeg',
    '.tif',
    '.tiff',
    '.bmp',
    '.webp',
}

SKIP_SUFFIXES = {
    '.mp4', '.mkv', '.avi', '.mov', '.mp3', '.wav', '.m4a', '.ogg',
    '.zip', '.gz', '.7z', '.rar',
    '.exe', '.msi', '.apk',
}

# Legacy binary MS Office formats. python-docx / python-pptx can only read the
# OOXML variants (.docx / .pptx), not the pre-2007 binaries. We track these
# separately so a run can report them (and the user can convert them) instead
# of silently dropping them as "unknown extension".
LEGACY_OFFICE_SUFFIXES = {
    '.doc', '.ppt', '.xls',
}


def sha256_file(path: Path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def safe_id(value: str):
    value = value.lower().strip()
    value = re.sub(r'[^a-z0-9_-]+', '_', value)
    value = re.sub(r'_+', '_', value)
    return value.strip('_')


def should_skip_file(path: Path, *, max_size_mb: float | None):
    lowered = str(path).lower()
    name = path.name.lower()

    skip_parts = [
        '/images/',
        '/css/',
        '/js/',
        '/fonts/',
        '/icons/',
        '/node_modules/',
        '/.git/',
        '/vendor/',
        '/mongo-dump/',
        '/captions/',
    ]

    skip_names = {
        'readme.md',
        'license.txt',
        'license.pdf',
        'redirect.html',
        'hidden.txt',
        'archivetimestamp.txt',
        'index.html',
    }

    if path.suffix.lower() in SKIP_SUFFIXES:
        return True

    if name in skip_names:
        return True

    if 'release notes' in name:
        return True

    if max_size_mb is not None:
        try:
            if path.stat().st_size > max_size_mb * 1024 * 1024:
                return True
        except OSError:
            return True

    return any(part in lowered for part in skip_parts)


def infer_metadata(path: Path):
    parts = [p.lower() for p in path.parts]

    subject = None
    grade_level = None
    language = None
    chapter_number = None

    for part in parts:
        m = re.fullmatch(r'class\s*(\d{1,2})', part)
        if m:
            grade_level = int(m.group(1))
            break
        m = re.search(r'(\d+)\s*ano', part)
        if m:
            grade_level = int(m.group(1))
            break
        m = re.search(r'grade[_ -]?(\d+)', part)
        if m:
            grade_level = int(m.group(1))
            break

    for part in parts:
        if part in {'en', 'eng', 'english'}:
            language = 'en'
            break
        if part in {'np', 'ne', 'nep', 'nepali'}:
            language = 'ne'
            break
        if part in {'pt', 'por', 'portuguese'}:
            language = 'pt'
            break

    subject_by_folder = {
        'math': 'math',
        'mathematics': 'math',
        'science': 'science',
        'socialstudies': 'social_studies',
        'social_studies': 'social_studies',
        'history': 'history',
        'geography': 'geography',
        'health': 'health',
        'english': 'english',
        'nepali': 'nepali',
    }
    for part in parts:
        if part in subject_by_folder:
            subject = subject_by_folder[part]
            break

    stem = path.stem
    m = re.search(r'(\d{2})$', stem)
    if m:
        try:
            chapter_number = int(m.group(1))
        except ValueError:
            chapter_number = None
    else:
        m = re.search(r'(\d+)$', stem)
        if m:
            try:
                chapter_number = int(m.group(1))
            except ValueError:
                chapter_number = None

    return grade_level, subject, language, chapter_number


def build_document_id(file_hash: str):
    return safe_id('doc_' + file_hash[:16])


def humanize_stem(stem: str):
    s = stem.replace('_', ' ').replace('-', ' ').strip()
    s = re.sub(r'\s+', ' ', s)
    return s[:1].upper() + s[1:] if s else 'Untitled'


def detect_chapters(pages, document_id, subject, grade_level, title_hint, chapter_number_hint: int | None):
    if chapter_number_hint is not None:
        return [{
            'id': f'{document_id}_ch_{chapter_number_hint}',
            'document_id': document_id,
            'chapter_number': chapter_number_hint,
            'chapter_title': title_hint,
            'subject': subject,
            'grade_level': grade_level,
            'page_start': 1,
            'page_end': max((p['page'] for p in pages), default=1),
            'keywords': [],
            'learning_goals': [],
            'sequence_order': 1,
        }]

    chapters = []
    found = []
    pattern = re.compile(r'^\s*(cap[ií]tulo|chapter)\s+(\d+)\b[:\- ]*(.*)$', re.IGNORECASE)

    for page in pages:
        lines = [line.strip() for line in page['text'].splitlines() if line.strip()]
        for line in lines[:14]:
            m = pattern.match(line)
            if m:
                ch_num = int(m.group(2))
                title_tail = m.group(3).strip()
                ch_title = title_tail if title_tail else f'Capítulo {ch_num}'
                found.append({'page': page['page'], 'chapter_number': ch_num, 'chapter_title': ch_title})
                break

    if not found:
        chapters.append({
            'id': f'{document_id}_ch_1',
            'document_id': document_id,
            'chapter_number': 1,
            'chapter_title': title_hint,
            'subject': subject,
            'grade_level': grade_level,
            'page_start': 1,
            'page_end': max((p['page'] for p in pages), default=1),
            'keywords': [],
            'learning_goals': [],
            'sequence_order': 1,
        })
        return chapters

    for i, ch in enumerate(found):
        start_page = ch['page']
        end_page = found[i + 1]['page'] - 1 if i + 1 < len(found) else max((p['page'] for p in pages), default=start_page)
        chapters.append({
            'id': f"{document_id}_ch_{ch['chapter_number']}",
            'document_id': document_id,
            'chapter_number': ch['chapter_number'],
            'chapter_title': ch['chapter_title'],
            'subject': subject,
            'grade_level': grade_level,
            'page_start': start_page,
            'page_end': end_page,
            'keywords': [],
            'learning_goals': [],
            'sequence_order': i + 1,
        })

    return chapters


def chapter_for_page(chapters, page_num):
    for ch in chapters:
        if ch['page_start'] <= page_num <= ch['page_end']:
            return ch
    return chapters[0]


def extract_keywords_basic(text, limit=8):
    words = re.findall(r'\b[\wÀ-ÿ]{4,}\b', text.lower())
    stop = {
        'para', 'como', 'mais', 'este', 'esta', 'essas', 'esses', 'sobre',
        'entre', 'pelas', 'pelos', 'ainda', 'porque', 'quando', 'onde',
        'which', 'with', 'that', 'from', 'into', 'have', 'your', 'their',
        'they', 'them', 'this', 'these', 'those', 'what', 'when', 'where',
        'will', 'then', 'than', 'just', 'into', 'also', 'much', 'very',
    }
    freq = {}
    for w in words:
        if w in stop:
            continue
        freq[w] = freq.get(w, 0) + 1
    ranked = sorted(freq.items(), key=lambda x: (-x[1], x[0]))
    return [w for w, _ in ranked[:limit]]


def build_arg_parser():
    p = argparse.ArgumentParser(description='Ingest LOOMA content into SQLite + ZVEC')
    p.add_argument('--root', type=Path, default=DEFAULT_ROOT, help='Root folder to ingest (default: $LOOMA_SOURCE_ROOT or data/raw/looma)')
    p.add_argument('--ocr-langs', default=os.environ.get('LOOMA_OCR_LANGS', 'eng+nep'), help='Tesseract languages (default: $LOOMA_OCR_LANGS or eng+nep)')
    # Default 300 MB: the previous 50 MB cap silently dropped 24 large PDFs
    # in content/, most of them CDC Nepali Teacher Guides (50–215 MB each).
    p.add_argument('--max-size-mb', type=float, default=300.0, help='Skip files above this size (default: 300MB). Use 0 to disable.')
    p.add_argument('--max-files', type=int, default=0, help='Limit number of files (0 = no limit)')
    p.add_argument('--include-images', action='store_true', help='Also OCR standalone image files. Off by default because LOOMA content has many thumbnails/assets.')
    p.add_argument('--fts-only', action='store_true', help='Populate SQLite/FTS only and skip embedding/ZVEC writes.')
    p.add_argument('--force', action='store_true', help='Reprocess files even when their hash is already indexed.')
    p.add_argument('--embedding-batch-size', type=int, default=128, help='Number of chunks to embed per ZVEC batch.')
    return p


def main():
    args = build_arg_parser().parse_args()

    root = args.root
    if not root.exists():
        raise SystemExit(f'LOOMA path not found: {root}')

    max_size_mb = None if args.max_size_mb == 0 else args.max_size_mb

    supported = set(SUPPORTED)
    if not args.include_images:
        supported -= IMAGE_SUFFIXES

    # One pass so we can surface legacy MS Office files alongside the
    # ingestable set (they would otherwise be silently dropped).
    files = []
    legacy_office_seen = []
    for p in root.rglob('*'):
        if not p.is_file():
            continue
        suf = p.suffix.lower()
        if suf in LEGACY_OFFICE_SUFFIXES:
            legacy_office_seen.append(p)
            continue
        if suf not in supported:
            continue
        if should_skip_file(p, max_size_mb=max_size_mb):
            continue
        files.append(p)

    if legacy_office_seen:
        print(f'[INFO] {len(legacy_office_seen)} legacy MS Office files (.doc / .ppt / .xls) '
              'found — these binary formats are NOT ingested. Convert them to '
              '.docx / .pptx (e.g. `libreoffice --headless --convert-to docx <file>`) '
              'to make them ingestible.')
        for p in legacy_office_seen[:8]:
            try:
                rel = p.relative_to(root)
            except ValueError:
                rel = p
            print(f'        - {rel}')
        if len(legacy_office_seen) > 8:
            print(f'        ... and {len(legacy_office_seen) - 8} more')

    if args.max_files and args.max_files > 0:
        files = files[: args.max_files]

    if not files:
        raise SystemExit('No supported files found in LOOMA folder.')

    conn = get_conn()
    existing_hashes = set()
    if not args.force:
        try:
            existing_hashes = {
                row[0]
                for row in conn.execute(
                    "SELECT file_hash FROM documents WHERE ingestion_status = 'indexed' AND file_hash IS NOT NULL"
                ).fetchall()
                if row[0]
            }
            if existing_hashes:
                print(f'[INFO] Skipping {len(existing_hashes)} already-indexed file hashes. Use --force to rebuild all.')
        except Exception as exc:
            print(f'[WARN] Could not load existing indexed hashes ({exc}); continuing without incremental skip.')

    embeddings_enabled = not args.fts_only
    embed_model = None
    curriculum_collection = None
    if embeddings_enabled:
        if zvec is None or open_curriculum_chunks is None or insert_curriculum_docs is None:
            print('[WARN] zvec is not available; continuing with SQLite/FTS-only ingestion.')
            embeddings_enabled = False
        else:
            try:
                embed_model = load_model()
                curriculum_collection = open_curriculum_chunks()
            except Exception as exc:
                print(f'[WARN] Embeddings unavailable ({exc}); continuing with SQLite/FTS-only ingestion.')
                embeddings_enabled = False
    seen_hashes = set()
    pending_zvec_ids = []
    pending_zvec_texts = []

    def flush_zvec_pending():
        nonlocal pending_zvec_ids, pending_zvec_texts
        if (
            not embeddings_enabled
            or embed_model is None
            or curriculum_collection is None
            or insert_curriculum_docs is None
            or zvec is None
            or not pending_zvec_ids
        ):
            return

        embeddings = embed_model.encode(pending_zvec_texts, normalize_embeddings=True)
        docs = [
            zvec.Doc(id=chunk_id, vectors={'embedding': emb.tolist()})
            for chunk_id, emb in zip(pending_zvec_ids, embeddings)
        ]
        insert_curriculum_docs(curriculum_collection, docs)
        pending_zvec_ids = []
        pending_zvec_texts = []

    for path in tqdm(files, desc='Ingesting LOOMA'):
        try:
            file_hash = sha256_file(path)
            if file_hash in seen_hashes:
                continue
            if file_hash in existing_hashes:
                continue
            seen_hashes.add(file_hash)

            grade_level, subject, language, chapter_number_hint = infer_metadata(path)
            pages = extract_any(path, ocr_langs=args.ocr_langs)

            document_id = build_document_id(file_hash)
            title_hint = humanize_stem(path.stem)

            doc_row = {
                'id': document_id,
                'source_path': str(path.resolve()),
                'file_name': path.name,
                'file_type': path.suffix.lower().lstrip('.'),
                'file_hash': file_hash,
                'language': language,
                'title': title_hint,
                'subject': subject,
                'grade_level': grade_level,
                'total_pages': len(pages),
                'ocr_required': 0,
                'ingestion_status': 'indexed',
            }
            upsert_document(conn, doc_row)

            chapters = detect_chapters(
                pages,
                document_id,
                subject,
                grade_level,
                title_hint,
                chapter_number_hint,
            )
            replace_chapters(conn, document_id, chapters)

            chunk_rows = []

            for page in pages:
                page_num = page['page']
                raw_text = clean_text(page['text'])
                if not raw_text:
                    continue
                if looks_like_scanned_or_empty(raw_text):
                    # If OCR isn't available, scanned PDFs often yield junk like "00".
                    # Skipping these chunks avoids polluting FTS + embeddings with meaningless text.
                    continue

                parent_chapter = chapter_for_page(chapters, page_num)
                chunks = chunk_text(raw_text, chunk_size=1200, overlap=200)
                if not chunks:
                    continue

                for idx, chunk in enumerate(chunks):
                    chunk_id = safe_id(f'{document_id}_p{page_num}_c{idx}')
                    keywords = extract_keywords_basic(chunk)

                    chunk_row = {
                        'id': chunk_id,
                        'document_id': document_id,
                        'chapter_id': parent_chapter['id'],
                        'section_title': humanize_stem(path.parent.name),
                        'chunk_index': idx,
                        'text': chunk,
                        'clean_text': chunk,
                        'page_start': page_num,
                        'page_end': page_num,
                        'language': language,
                        'content_type': 'theory',
                        'difficulty': None,
                        'pedagogical_role': 'core_concept',
                        'token_count': len(chunk.split()),
                        'char_count': len(chunk),
                        'keywords': keywords,
                        'learning_objectives': [],
                        'prerequisites': [],
                        'related_concepts': [],
                        'zvec_doc_id': chunk_id if embeddings_enabled else None,
                        'chapter_title': parent_chapter['chapter_title'],
                        'subject': subject,
                        'grade_level': grade_level,
                    }
                    chunk_rows.append(chunk_row)

                    if embeddings_enabled:
                        pending_zvec_ids.append(chunk_id)
                        pending_zvec_texts.append(chunk)
                        if len(pending_zvec_ids) >= max(1, args.embedding_batch_size):
                            flush_zvec_pending()

            replace_chunks(conn, document_id, chunk_rows)
            commit(conn)

        except Exception as e:
            import traceback

            print(f'[ERROR] {path}: {repr(e)}')
            traceback.print_exc()

    flush_zvec_pending()
    print('LOOMA ingestion complete.')


if __name__ == '__main__':
    main()
