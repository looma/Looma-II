# Prometheus 3.x is required: Coroot 1.8.x ships Remote Write v2
# (zstd / protobuf-v2). Prometheus 2.55 supports only PRWv1
# (snappy / protobuf-v1), which is why every push from Coroot came back as
# "Error decompressing remote write request: snappy: corrupt input".
FROM prom/prometheus:v3.12.0 AS upstream

FROM alpine:3.22

COPY --from=upstream /bin/prometheus /bin/prometheus
COPY --from=upstream /bin/promtool /bin/promtool

RUN mkdir -p /etc/prometheus /prometheus \
    && chown -R nobody:nobody /etc/prometheus /prometheus

COPY prometheus.yml /etc/prometheus/prometheus.yml

USER nobody
WORKDIR /prometheus
VOLUME ["/prometheus"]
EXPOSE 9091
ENTRYPOINT ["/bin/prometheus"]
CMD ["--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.path=/prometheus"]
