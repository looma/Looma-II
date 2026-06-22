FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app
COPY topology_probe.py /app/topology_probe.py

# Stdlib-only — no extra packages needed. Keep the image tiny so this
# auxiliary sidecar never blocks rebuilds of the rest of the stack.
CMD ["python", "/app/topology_probe.py"]
