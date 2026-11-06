FROM opensearchproject/opensearch:3.6.0

# Prometheus exporter — exposes OpenSearch's own cluster/node/index stats at
# /_prometheus/metrics so Prometheus can scrape THIS box's OpenSearch the
# same way it already scrapes otel-collector/vector/data-prepper/grafana.
# Not bundled with the base image; plugin version must match the OpenSearch
# version exactly (see docs.opensearch.org/latest/observing-your-data/prometheusmetrics/).
RUN /usr/share/opensearch/bin/opensearch-plugin install --batch \
    https://github.com/opensearch-project/opensearch-prometheus-exporter/releases/download/3.6.0.0/prometheus-exporter-3.6.0.0.zip
