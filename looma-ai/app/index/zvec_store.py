import os
import zvec

EMBED_DIM = 384


def open_or_create_collection(path, name):
    if os.path.exists(path):
        return zvec.open(path=path)

    schema = zvec.CollectionSchema(
        name=name,
        vectors=zvec.VectorSchema('embedding', zvec.DataType.VECTOR_FP32, EMBED_DIM),
    )
    return zvec.create_and_open(path=path, schema=schema)


def open_curriculum_chunks():
    return open_or_create_collection('data/zvec/curriculum_chunks', 'curriculum_chunks')


def open_glossary_entries():
    return open_or_create_collection('data/zvec/glossary_entries', 'glossary_entries')


def open_exercise_bank():
    return open_or_create_collection('data/zvec/exercise_bank', 'exercise_bank')


def open_generated_assets():
    return open_or_create_collection('data/zvec/generated_assets', 'generated_assets')


def insert_curriculum_docs(collection, docs):
    if docs:
        collection.insert(docs)