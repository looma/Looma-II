import argparse
import hashlib
import os
import re
from pathlib import Path

from bson import ObjectId
from pymongo import MongoClient, UpdateOne


def _clean_text(s: str) -> str:
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def _stable_object_id(namespace: str, rel_path: str) -> ObjectId:
    h = hashlib.md5((namespace + "::" + rel_path).encode("utf-8")).hexdigest()
    return ObjectId(h[:24])


def _extract_pdf_text(path: Path, *, max_pages: int, max_chars: int) -> str:
    try:
        import fitz  # PyMuPDF
    except Exception:
        return ""

    text_parts: list[str] = []
    try:
        doc = fitz.open(str(path))
        n = min(len(doc), max_pages)
        for i in range(n):
            try:
                page = doc.load_page(i)
                t = page.get_text("text") or ""
                t = _clean_text(t)
                if t:
                    text_parts.append(t)
                if sum(len(x) for x in text_parts) >= max_chars:
                    break
            except Exception:
                continue
        try:
            doc.close()
        except Exception:
            pass
    except Exception:
        return ""

    out = " ".join(text_parts)
    return out[:max_chars]


def iter_pdfs(root: Path):
    for p in root.rglob("*.pdf"):
        if p.is_file():
            yield p


def build_doc(content_root: Path, path: Path, *, lang: str, max_pages: int, max_chars: int):
    rel_from_content = path.relative_to(content_root).as_posix()
    fp_rel = "/".join(rel_from_content.split("/")[:-1])
    fp = "../content/" + (fp_rel + "/" if fp_rel else "")
    fn = path.name

    dn = path.stem.replace("_", " ").replace("-", " ")
    text = _extract_pdf_text(path, max_pages=max_pages, max_chars=max_chars)

    _id = _stable_object_id("pdfs", rel_from_content)
    return {
        "_id": _id,
        "src": "PDFs",
        "ft": "pdf",
        "fp": fp,
        "fn": fn,
        "dn": dn[:200],
        "lang": lang,
        "pdf_relpath": rel_from_content,
        "text": text,
    }


def main():
    ap = argparse.ArgumentParser(description="Ingest Looma/content/pdfs into MongoDB activities")
    ap.add_argument("--content-root", default=os.environ.get("LOOMA_CONTENT_ROOT", "/looma/content"))
    ap.add_argument("--pdfs-root", default=os.environ.get("LOOMA_PDFS_ROOT", "/looma/content/pdfs"))
    ap.add_argument("--mongo-url", default=os.environ.get("LOOMA_MONGO_URL", "mongodb://looma-db:27017"))
    ap.add_argument("--mongo-db", default=os.environ.get("LOOMA_MONGO_DB", "looma"))
    ap.add_argument("--mongo-collection", default=os.environ.get("LOOMA_MONGO_COLLECTION", "activities"))
    ap.add_argument("--lang", default=os.environ.get("LOOMA_PDFS_LANG", "en"))
    ap.add_argument("--batch", type=int, default=200)
    ap.add_argument("--max-pages", type=int, default=3)
    ap.add_argument("--max-chars", type=int, default=20000)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    content_root = Path(args.content_root)
    pdfs_root = Path(args.pdfs_root)
    if not pdfs_root.exists():
        raise SystemExit(f"PDFs root not found: {pdfs_root}")

    client = MongoClient(args.mongo_url, serverSelectionTimeoutMS=5000)
    coll = client[args.mongo_db][args.mongo_collection]

    ops: list[UpdateOne] = []
    n = 0
    for p in iter_pdfs(pdfs_root):
        doc = build_doc(
            content_root,
            p,
            lang=args.lang,
            max_pages=max(0, int(args.max_pages)),
            max_chars=max(0, int(args.max_chars)),
        )
        ops.append(UpdateOne({"_id": doc["_id"]}, {"$set": doc}, upsert=True))
        n += 1
        if len(ops) >= args.batch:
            if not args.dry_run:
                coll.bulk_write(ops, ordered=False)
            ops = []
            print(f"upserted {n}", flush=True)

    if ops:
        if not args.dry_run:
            coll.bulk_write(ops, ordered=False)
        print(f"upserted {n}", flush=True)

    print("done", flush=True)


if __name__ == "__main__":
    main()

