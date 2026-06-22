# Looma OpenSearch retention sidecar.
# The script is baked into the image with COPY rather than bind-mounted from
# the host. A host bind mount (./looma-retention.sh) makes the service fail to
# start whenever Docker Desktop's host-path mount layer is in a bad state
# ("error while creating mount source path ... mkdir /run/desktop/mnt").
FROM curlimages/curl:8.10.1
COPY looma-retention.sh /opt/looma-retention.sh
