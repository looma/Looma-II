# 2.12.0 is published for linux/amd64 ONLY — it cannot run on the aarch64 odroid
# ("no matching manifest for linux/arm64"). Data Prepper ships arm64 images from
# 2.14.0 onward; pin a multi-arch tag so the same Dockerfile builds on amd64 (dev)
# and arm64 (odroid). 2.x pipeline/config is compatible across these minors.
FROM opensearchproject/data-prepper:2.14.1

COPY pipelines.yaml /usr/share/data-prepper/pipelines/pipelines.yaml
COPY data-prepper-config.yaml /usr/share/data-prepper/config/data-prepper-config.yaml
