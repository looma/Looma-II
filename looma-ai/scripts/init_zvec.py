from pathlib import Path
import os
import zvec

BASE = Path("data/zvec")
BASE.mkdir(parents=True, exist_ok=True)

EMBED_DIM = 384

def create_or_open_collection(path_str, name, vector_field):
    path = str(BASE / path_str)

    if os.path.exists(path):
        collection = zvec.open(path=path)
        print(f"OPENED -> {name} @ {path}")
        return collection

    schema = zvec.CollectionSchema(
        name=name,
        vectors=zvec.VectorSchema(vector_field, zvec.DataType.VECTOR_FP32, EMBED_DIM),
    )
    collection = zvec.create_and_open(path=path, schema=schema)
    print(f"CREATED -> {name} @ {path}")
    return collection

def main():
    create_or_open_collection("curriculum_chunks", "curriculum_chunks", "embedding")
    create_or_open_collection("glossary_entries", "glossary_entries", "embedding")
    create_or_open_collection("exercise_bank", "exercise_bank", "embedding")
    create_or_open_collection("generated_assets", "generated_assets", "embedding")

if __name__ == "__main__":
    main()
