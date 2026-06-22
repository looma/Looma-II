import argparse
import hashlib
import os
import re
from pathlib import Path

from bson import ObjectId
from pymongo import MongoClient, UpdateOne


def _clean_text(s: str) -> str:
    s = re.sub(r"<script[^>]*>.*?</script>", " ", s, flags=re.I | re.S)
    s = re.sub(r"<style[^>]*>.*?</style>", " ", s, flags=re.I | re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def _clean_vtt(s: str) -> str:
    s = re.sub(r"^\ufeff?WEBVTT.*?$", " ", s, flags=re.M)
    s = re.sub(r"^\d+$", " ", s, flags=re.M)
    s = re.sub(r"^\d{2}:\d{2}:\d{2}\.\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}\.\d{3}.*?$", " ", s, flags=re.M)
    s = re.sub(r"^\d{2}:\d{2}\.\d{3}\s+-->\s+\d{2}:\d{2}\.\d{3}.*?$", " ", s, flags=re.M)
    return _clean_text(s)


def _stable_object_id(namespace: str, rel_path: str) -> ObjectId:
    h = hashlib.md5((namespace + "::" + rel_path).encode("utf-8")).hexdigest()
    return ObjectId(h[:24])


def _extract_pdf_text(path: Path, *, max_pages: int, max_chars: int) -> str:
    try:
        import fitz  # PyMuPDF
    except Exception:
        return ""

    parts: list[str] = []
    try:
        doc = fitz.open(str(path))
        n = min(len(doc), max_pages)
        for i in range(n):
            try:
                page = doc.load_page(i)
                t = page.get_text("text") or ""
                t = _clean_text(t)
                if t:
                    parts.append(t)
                if sum(len(x) for x in parts) >= max_chars:
                    break
            except Exception:
                continue
        try:
            doc.close()
        except Exception:
            pass
    except Exception:
        return ""

    return (" ".join(parts))[:max_chars]


def _dn_from_filename(path: Path) -> str:
    return path.stem.replace("_", " ").replace("-", " ").strip()[:200]


def _doc_for_file(content_root: Path, p: Path, *, namespace: str, src: str, lang: str, max_pdf_pages: int, max_pdf_chars: int):
    rel = p.relative_to(content_root).as_posix()
    fp_rel = "/".join(rel.split("/")[:-1])
    fp = "../content/" + (fp_rel + "/" if fp_rel else "")
    fn = p.name

    suf = p.suffix.lower()
    ft = None
    text = ""

    if suf in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
        ft = "image"
        text = _dn_from_filename(p)
    elif suf == ".pdf":
        ft = "pdf"
        text = _extract_pdf_text(p, max_pages=max_pdf_pages, max_chars=max_pdf_chars)
    elif suf in {".html", ".htm", ".txt", ".md"}:
        ft = "html" if suf in {".html", ".htm"} else "text"
        text = _clean_text(p.read_text(encoding="utf-8", errors="ignore"))[:40000]
    elif suf == ".vtt":
        ft = "vtt"
        text = _clean_vtt(p.read_text(encoding="utf-8", errors="ignore"))[:40000]
    elif suf in {".mp4", ".m4v", ".mov"}:
        ft = "video"
        text = _dn_from_filename(p)
    elif suf in {".mp3", ".m4a", ".wav", ".ogg"}:
        ft = "audio"
        text = _dn_from_filename(p)
    else:
        return None

    _id = _stable_object_id(namespace, rel)
    return {
        "_id": _id,
        "src": src,
        "ft": ft,
        "fp": fp,
        "fn": fn,
        "dn": _dn_from_filename(p),
        "lang": lang,
        "relpath": rel,
        "text": text,
    }


def _iter_files(root: Path):
    for p in root.rglob("*"):
        if p.is_file():
            yield p


def ingest_folder(
    coll,
    *,
    content_root: Path,
    folder: Path,
    namespace: str,
    src: str,
    lang: str,
    batch: int,
    dry_run: bool,
    max_pdf_pages: int,
    max_pdf_chars: int,
):
    ops: list[UpdateOne] = []
    n = 0
    for p in _iter_files(folder):
        doc = _doc_for_file(
            content_root,
            p,
            namespace=namespace,
            src=src,
            lang=lang,
            max_pdf_pages=max_pdf_pages,
            max_pdf_chars=max_pdf_chars,
        )
        if not doc:
            continue
        ops.append(UpdateOne({"_id": doc["_id"]}, {"$set": doc}, upsert=True))
        n += 1
        if len(ops) >= batch:
            if not dry_run:
                coll.bulk_write(ops, ordered=False)
            ops = []
            print(f"{src}: upserted {n}", flush=True)

    if ops:
        if not dry_run:
            coll.bulk_write(ops, ordered=False)
        print(f"{src}: upserted {n}", flush=True)


def main():
    ap = argparse.ArgumentParser(description="Bulk-ingest selected Looma content folders into MongoDB activities")
    ap.add_argument("--content-root", default=os.environ.get("LOOMA_CONTENT_ROOT", "/looma/content"))
    ap.add_argument("--mongo-url", default=os.environ.get("LOOMA_MONGO_URL", "mongodb://looma-db:27017"))
    ap.add_argument("--mongo-db", default=os.environ.get("LOOMA_MONGO_DB", "looma"))
    ap.add_argument("--mongo-collection", default=os.environ.get("LOOMA_MONGO_COLLECTION", "activities"))
    ap.add_argument("--lang", default="en")
    ap.add_argument("--batch", type=int, default=300)
    ap.add_argument("--max-pdf-pages", type=int, default=2)
    ap.add_argument("--max-pdf-chars", type=int, default=12000)
    ap.add_argument("--dry-run", action="store_true")

    ap.add_argument("--dr-dann", action="store_true")
    ap.add_argument("--encyclopedias", action="store_true")
    ap.add_argument("--dictionary-images", action="store_true")
    ap.add_argument("--astronomy", action="store_true")
    ap.add_argument("--lessons", action="store_true")
    ap.add_argument("--teacher-tools", action="store_true")
    ap.add_argument("--videos", action="store_true")
    ap.add_argument("--edited-videos", action="store_true")
    ap.add_argument(
        "--rest",
        action="store_true",
        help="Ingest all other top-level content folders not explicitly selected.",
    )
    ap.add_argument(
        "--all",
        action="store_true",
        help="Ingest every top-level folder under content (except internal skip list).",
    )
    ap.add_argument(
        "--exclude",
        action="append",
        default=[],
        help="Exclude a top-level content folder by name (repeatable).",
    )
    ap.add_argument(
        "--folder",
        action="append",
        default=[],
        help="Ingest only this top-level content folder (repeatable).",
    )
    args = ap.parse_args()

    content_root = Path(args.content_root)
    client = MongoClient(args.mongo_url, serverSelectionTimeoutMS=5000)
    coll = client[args.mongo_db][args.mongo_collection]

    selected = {
        "Dr Dann": (args.dr_dann, "Dr Dann", "Dr Dann"),
        "Encyclopedias": (args.encyclopedias, "encyclopedias", "Encyclopedias"),
        "Dictionary Images": (args.dictionary_images, "dictionary images", "Dictionary Images"),
        "Astronomy": (args.astronomy, "astronomy", "Astronomy"),
        "Lessons": (args.lessons, "lessons", "Lessons"),
        "Teacher Tools": (args.teacher_tools, "Teacher Tools", "Teacher Tools"),
        "Videos": (args.videos, "videos", "Videos"),
        "Edited Videos": (args.edited_videos, "edited videos", "Edited Videos"),
    }

    # Default behavior (no flags) is the original set from the user's request.
    if not any(v[0] for v in selected.values()) and not args.rest and not args.all and not args.folder:
        for k in list(selected.keys()):
            enabled, folder_name, src = selected[k]
            selected[k] = (True, folder_name, src)

    exclude = {e.strip() for e in (args.exclude or []) if e and e.strip()}
    internal_skip = {
        # These are not content roots we want to index as "activities".
        "hidden",
        "__macosx",
        ".git",
    }

    def run_one(folder_name: str, src: str):
        if folder_name in internal_skip or folder_name in exclude:
            print(f"skip {src}: excluded", flush=True)
            return
        folder = content_root / folder_name
        if not folder.exists():
            print(f"skip {src}: not found at {folder}", flush=True)
            return
        ingest_folder(
            coll,
            content_root=content_root,
            folder=folder,
            namespace=folder_name,
            src=src,
            lang=args.lang,
            batch=args.batch,
            dry_run=args.dry_run,
            max_pdf_pages=max(0, int(args.max_pdf_pages)),
            max_pdf_chars=max(0, int(args.max_pdf_chars)),
        )

    if args.all or args.rest:
        # Determine which top-level folders exist.
        top_level = []
        try:
            for p in content_root.iterdir():
                if p.is_dir():
                    top_level.append(p.name)
        except Exception:
            top_level = []

        # Build a set of already-selected (explicit) folder names.
        explicit_folders = {folder_name for (enabled, folder_name, _src) in selected.values() if enabled}

        # If --all: include everything; if --rest: include only what isn't explicit.
        targets = sorted(set(top_level) - internal_skip)
        if args.rest and not args.all:
            targets = [t for t in targets if t not in explicit_folders]

        for folder_name in targets:
            run_one(folder_name, folder_name)

    if args.folder:
        for folder_name in args.folder:
            folder_name = (folder_name or "").strip()
            if not folder_name:
                continue
            run_one(folder_name, folder_name)

    # Always run explicit selections too.
    for name, (enabled, folder_name, src) in selected.items():
        if not enabled:
            continue
        run_one(folder_name, src)

    print("done", flush=True)


if __name__ == "__main__":
    main()
