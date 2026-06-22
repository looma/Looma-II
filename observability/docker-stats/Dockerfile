FROM python:3.11-slim

WORKDIR /app

COPY exporter.py /app/exporter.py

RUN pip install --no-cache-dir docker==7.1.0 prometheus_client==0.20.0

EXPOSE 9417

CMD ["python", "/app/exporter.py"]
