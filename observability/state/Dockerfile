# Looma observability bootstrap — one-shot OpenSearch state importer.
# The state/ directory is baked into the image with COPY rather than being
# bind-mounted from the host, so the service cannot fail to start when Docker
# Desktop's host-path mount layer is in a bad state ("error while creating
# mount source path ... mkdir /run/desktop/mnt").
#
# After refreshing the snapshot with state/snapshot.sh, rebuild this image:
#   docker compose build bootstrap
FROM curlimages/curl:8.10.1
COPY . /state
