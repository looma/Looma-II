import argparse
import hashlib
import json
import os
import re
from pathlib import Path

from bson import ObjectId
from pymongo import MongoClient, UpdateOne


STRING_KEYS = {
    "name",
    "title",
    "dn",
    "description",
    "summary",
    "caption",
    "label",
    "district",
    "province",
    "region",
    "country",
    "capital",
}


def _clean_text(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def _stable_object_id(namespace: str, rel_path: str) -> ObjectId:
    h = hashlib.md5((namespace + "::" + rel_path).encode("utf-8")).hexdigest()
    return ObjectId(h[:24])


def _collect_strings(value, key: str | None = None) -> list[str]:
    out: list[str] = []
    if isinstance(value, str):
        t = _clean_text(value)
        if t and (key is None or key.lower() in STRING_KEYS):
            out.append(t)
    elif isinstance(value, dict):
        for k, v in value.items():
            out.extend(_collect_strings(v, str(k)))
    elif isinstance(value, list):
        for v in value:
            out.extend(_collect_strings(v, key))
    return out


def _text_from_json(path: Path) -> str:
    raw = path.read_text(encoding="utf-8", errors="ignore")
    try:
        data = json.loads(raw)
    except Exception:
        return _clean_text(raw)

    parts = _collect_strings(data, None)
    if not parts:
        return ""
    # Keep stable order and cap size.
    uniq = list(dict.fromkeys(parts))
    return " ".join(uniq)[:40000]


def iter_map_data_files(root: Path):
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        suf = p.suffix.lower()
        if suf not in {".geojson", ".json", ".txt"}:
            continue
        name = p.name.lower()
        if name in {"hidden.txt", "hiddenxxx.txt"}:
            continue
        yield p


def build_doc(content_root: Path, path: Path, *, lang: str):
    rel_from_content = path.relative_to(content_root).as_posix()
    fp_rel = "/".join(rel_from_content.split("/")[:-1])
    fp = "../content/" + (fp_rel + "/" if fp_rel else "")
    fn = path.name

    text = _text_from_json(path) if path.suffix.lower() in {".geojson", ".json"} else _clean_text(
        path.read_text(encoding="utf-8", errors="ignore")
    )
    dn = path.stem.replace("_", " ").replace("-", " ")

    _id = _stable_object_id("maps", rel_from_content)

    return {
        "_id": _id,
        "src": "Maps",
        "ft": "map",
        "fp": fp,
        "fn": fn,
        "dn": dn[:200],
        "lang": lang,
        "maps_relpath": rel_from_content,
        "text": text[:40000],
    }


def main():
    ap = argparse.ArgumentParser(description="Ingest Looma/content/maps data into MongoDB activities")
    ap.add_argument("--content-root", default=os.environ.get("LOOMA_CONTENT_ROOT", "/looma/content"))
    ap.add_argument("--maps-root", default=os.environ.get("LOOMA_MAPS_ROOT", "/looma/content/maps"))
    ap.add_argument("--mongo-url", default=os.environ.get("LOOMA_MONGO_URL", "mongodb://looma-db:27017"))
    ap.add_argument("--mongo-db", default=os.environ.get("LOOMA_MONGO_DB", "looma"))
    ap.add_argument("--mongo-collection", default=os.environ.get("LOOMA_MONGO_COLLECTION", "activities"))
    ap.add_argument("--lang", default=os.environ.get("LOOMA_MAPS_LANG", "en"))
    ap.add_argument("--batch", type=int, default=500)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    content_root = Path(args.content_root)
    maps_root = Path(args.maps_root)
    if not maps_root.exists():
        raise SystemExit(f"Maps root not found: {maps_root}")

    client = MongoClient(args.mongo_url, serverSelectionTimeoutMS=5000)
    coll = client[args.mongo_db][args.mongo_collection]

    ops: list[UpdateOne] = []
    n = 0
    for p in iter_map_data_files(maps_root):
        doc = build_doc(content_root, p, lang=args.lang)
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

