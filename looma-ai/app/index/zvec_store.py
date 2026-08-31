import os

import zvec

from app.paths import ZVEC_DIR, zvec_collection_path

EMBED_DIM = 384


def open_or_create_collection(path, name):
    path = str(path)
    if os.path.exists(path):
        return zvec.open(path=path)

    # zvec.create_and_open() will not create the intermediate directories.
    ZVEC_DIR.mkdir(parents=True, exist_ok=True)
    schema = zvec.CollectionSchema(
        name=name,
        vectors=zvec.VectorSchema('embedding', zvec.DataType.VECTOR_FP32, EMBED_DIM),
    )
    return zvec.create_and_open(path=path, schema=schema)


def _open(name):
    # app.paths anchors this to the package root, so the collection a caller
    # gets no longer depends on the directory the process was started from.
    return open_or_create_collection(zvec_collection_path(name), name)


def open_curriculum_chunks():
    return _open('curriculum_chunks')


def open_glossary_entries():
    return _open('glossary_entries')


def open_exercise_bank():
    return _open('exercise_bank')


def open_generated_assets():
    return _open('generated_assets')


def insert_curriculum_docs(collection, docs):
    if docs:
        collection.insert(docs)
