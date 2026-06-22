FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# NOTE: zvec source vendoring not present in this repo snapshot; install from PyPI instead.
COPY Looma/search-service/search_service.py /app/search_service.py

RUN python -m pip install --upgrade pip wheel \
    && python -m pip install "setuptools==80.9.0" \
    && python -m pip install flask gunicorn pymongo scikit-learn \
    && python -m pip install scipy \
    # CPU-only torch + sentence-transformers for true semantic embeddings.
    # On aarch64 these wheels are published by PyTorch and install cleanly.
    && python -m pip install --extra-index-url https://download.pytorch.org/whl/cpu \
         "torch==2.4.1" \
    && python -m pip install "sentence-transformers==3.0.1" \
    && python -m pip install \
         opentelemetry-distro==0.48b0 \
         opentelemetry-exporter-otlp-proto-http==1.27.0 \
         opentelemetry-instrumentation-flask==0.48b0 \
         opentelemetry-instrumentation-pymongo==0.48b0 \
         opentelemetry-instrumentation-requests==0.48b0 \
         opentelemetry-instrumentation-urllib==0.48b0 \
         opentelemetry-instrumentation-logging==0.48b0 \
    # Keep setuptools < 81 so pkg_resources exists for opentelemetry-instrument.
    && opentelemetry-bootstrap -a install || true

# Bake the embedding model INTO the image so zvec works OFFLINE — no first-run
# HuggingFace download (which would silently break search on a box with no/poor
# internet) and a much faster first index build. HF_HOME=/models/hf matches the
# runtime path the compose sets, and the (initially empty) looma_search_hf named
# volume is auto-populated from this baked dir the first time the container runs.
ENV HF_HOME=/models/hf
# all-MiniLM-L6-v2 (384-dim) matches EMBEDDING_DIM=384 and is ~5x faster / far lighter
# on CPU than all-mpnet-base-v2 — so the background index build finishes much sooner.
ENV MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('${MODEL_NAME}')"

EXPOSE 46333

# `opentelemetry-instrument` reads OTEL_* env vars (set in compose) and
# auto-instruments Flask/pymongo/requests for inbound + downstream tracing.
# --timeout 900: the zvec index is built lazily on the first /search or /rebuild
# (full-corpus embedding). On the slower aarch64 CPU that can exceed the old 180s
# and get the worker killed mid-build, leaving search broken. 900s gives it room.
CMD ["opentelemetry-instrument", "gunicorn", "--bind", "0.0.0.0:46333", "--workers", "1", "--threads", "1", "--timeout", "900", "--access-logfile", "-", "--error-logfile", "-", "search_service:app"]
