FROM docker.elastic.co/beats/metricbeat:8.12.2

COPY metricbeat.yml /usr/share/metricbeat/metricbeat.yml
# Runs as root at build time regardless of the base image's own default user
# (docker-compose.yml also sets `user: root` for this service at runtime, to
# read /var/run/docker.sock) — switch back to the base image's own default
# (uid 1000) afterward so anything NOT using that compose override still
# gets the image's original, non-root default.
USER root
COPY docker-entrypoint-wrapper.sh /usr/local/bin/docker-entrypoint-wrapper.sh
RUN chmod +x /usr/local/bin/docker-entrypoint-wrapper.sh
USER 1000
ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/docker-entrypoint-wrapper.sh"]
