import os
from functools import lru_cache

MODEL_NAME = os.environ.get('LOOMA_EMBED_MODEL', 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
DISABLE_EMBEDDINGS = (os.environ.get('LOOMA_DISABLE_EMBEDDINGS') or '').strip() in {'1', 'true', 'yes'}


def _device_from_env() -> str:
    device = (os.environ.get('LOOMA_DEVICE') or 'cpu').strip().lower()
    if device in {'cpu', 'cuda', 'mps'}:
        return device
    return 'cpu'


@lru_cache(maxsize=1)
def load_model():
    if DISABLE_EMBEDDINGS:
        raise RuntimeError('Embeddings disabled (set LOOMA_DISABLE_EMBEDDINGS=0 to enable)')

    # Absolute, package-anchored: a relative 'data/models' put the model cache
    # wherever the process happened to start, which is how a second copy of the
    # AI data tree came to exist next to the real one (see app/paths.py).
    from app.paths import MODELS_DIR

    os.environ.setdefault('HF_HOME', str(MODELS_DIR))
    os.environ.setdefault('TRANSFORMERS_CACHE', str(MODELS_DIR))
    device = _device_from_env()
    # Import lazily so the server can start even if torch/CPU features are incompatible
    # (ExitCode 132 / illegal instruction). This allows FTS-only operation.
    from sentence_transformers import SentenceTransformer  # noqa: WPS433

    return SentenceTransformer(MODEL_NAME, device=device)
