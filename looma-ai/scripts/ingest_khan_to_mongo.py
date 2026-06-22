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
    # Remove WEBVTT header, timestamps, and cue settings.
    s = re.sub(r"^\ufeff?WEBVTT.*?$", " ", s, flags=re.M)
    s = re.sub(r"^\d+$", " ", s, flags=re.M)
    s = re.sub(r"^\d{2}:\d{2}:\d{2}\.\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}\.\d{3}.*?$", " ", s, flags=re.M)
    s = re.sub(r"^\d{2}:\d{2}\.\d{3}\s+-->\s+\d{2}:\d{2}\.\d{3}.*?$", " ", s, flags=re.M)
    return _clean_text(s)


def _html_title(html: str) -> str | None:
    m = re.search(r"<title[^>]*>(.*?)</title>", html, flags=re.I | re.S)
    if not m:
        return None
    t = _clean_text(m.group(1))
    return t[:200] if t else None


def _stable_object_id(namespace: str, rel_path: str) -> ObjectId:
    # Deterministic ObjectId from a stable namespace+path; avoids duplicates across reruns.
    h = hashlib.md5((namespace + "::" + rel_path).encode("utf-8")).hexdigest()
    return ObjectId(h[:24])


def iter_khan_files(root: Path):
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        suf = p.suffix.lower()
        if suf not in {".html", ".htm", ".txt", ".md", ".vtt"}:
            continue
        # Skip obvious non-content plumbing.
        lowered = str(p).lower().replace("\\", "/")
        if "/videojs/" in lowered or "/img/" in lowered:
            continue
        yield p


def build_doc(root: Path, path: Path, *, lang: str):
    rel = path.relative_to(root).as_posix()
    fp_rel = "/".join(rel.split("/")[:-1])
    fp = "../content/Khan/" + (fp_rel + "/" if fp_rel else "")
    fn = path.name

    raw = path.read_text(encoding="utf-8", errors="ignore")
    title = _html_title(raw) if path.suffix.lower() in {".html", ".htm"} else None
    dn = title or path.stem.replace("_", " ").replace("-", " ")
    if path.suffix.lower() == ".vtt":
        text = _clean_vtt(raw)[:20000]
    else:
        text = _clean_text(raw)[:20000]

    _id = _stable_object_id("khan", rel)

    return {
        "_id": _id,
        "src": "Khan",
        "ft": "html" if path.suffix.lower() in {".html", ".htm"} else ("vtt" if path.suffix.lower() == ".vtt" else "text"),
        "fp": fp,
        "fn": fn,
        "dn": dn,
        "lang": lang,
        "khan_relpath": rel,
        "text": text,
    }


def main():
    ap = argparse.ArgumentParser(description="Ingest Looma/content/Khan into MongoDB activities")
    ap.add_argument("--root", default=os.environ.get("LOOMA_KHAN_ROOT", "/looma/content/Khan"))
    ap.add_argument("--mongo-url", default=os.environ.get("LOOMA_MONGO_URL", "mongodb://looma-db:27017"))
    ap.add_argument("--mongo-db", default=os.environ.get("LOOMA_MONGO_DB", "looma"))
    ap.add_argument("--mongo-collection", default=os.environ.get("LOOMA_MONGO_COLLECTION", "activities"))
    ap.add_argument("--lang", default=os.environ.get("LOOMA_KHAN_LANG", "en"))
    ap.add_argument("--batch", type=int, default=500)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    root = Path(args.root)
    if not root.exists():
        raise SystemExit(f"Root not found: {root}")

    client = MongoClient(args.mongo_url, serverSelectionTimeoutMS=5000)
    coll = client[args.mongo_db][args.mongo_collection]

    ops = []
    n = 0
    for p in iter_khan_files(root):
        doc = build_doc(root, p, lang=args.lang)
        ops.append(
            UpdateOne(
                {"_id": doc["_id"]},
                {"$set": doc},
                upsert=True,
            )
        )
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
