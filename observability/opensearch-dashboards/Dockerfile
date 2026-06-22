FROM opensearchproject/opensearch-dashboards:3.6.0

# Patch the Observability plugin's correlated-logs PPL builder to emit double
# quotes around string values. Single quotes are valid in the PPL engine but
# break in the Logs Explorer UI (silent 400 from /api/ppl/search). Without this
# patch, clicking "View associated logs" from a trace yields an empty result.
#
# Idempotent — also wired into bootstrap so it self-heals on plugin upgrades
# that re-introduce the single-quote variant. See observability/state/.
COPY --chmod=0755 patch-observability-plugin.sh /opt/patch-observability-plugin.sh

USER root
RUN /opt/patch-observability-plugin.sh
USER opensearch-dashboards
