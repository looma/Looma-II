FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    NUMEXPR_NUM_THREADS=1 \
    TOKENIZERS_PARALLELISM=false

COPY requirements.txt /app/requirements.txt

# NOTE: opentelemetry-instrument (0.48b0) still imports pkg_resources.
# Newer setuptools releases removed pkg_resources, so we pin setuptools via requirements.txt.
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

EXPOSE 8089
