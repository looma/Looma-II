#!/bin/sh
# LOOMA_METRICBEAT_MONGO_HOST=auto -> resolve this container's own default
# gateway and use THAT as the mongodb module's target host.
#
# Why: on a native odroid install, MongoDB is host-installed (not a
# container), reachable from this bridge-networked (loomanet) container only
# via the network's gateway address — which is whatever subnet Docker
# happened to assign loomanet on THIS box, not a fixed value across
# installs. `--add-host=host.docker.internal:host-gateway` resolves to the
# DEFAULT bridge's gateway (docker0), not a custom network's own gateway, so
# it doesn't help here. Reading /proc/net/route for the default route's
# gateway is the kernel's own answer to "how do I reach my host" from
# *this* network namespace — correct regardless of which subnet was
# assigned, no `ip`/`route` binary needed.
if [ "$LOOMA_METRICBEAT_MONGO_HOST" = "auto" ]; then
  gw_hex="$(awk '$2 == "00000000" {print $3; exit}' /proc/net/route)"
  if [ -n "$gw_hex" ]; then
    # /proc/net/route stores the gateway little-endian: the first 2 hex
    # chars are the IP's LAST octet, the last 2 hex chars are its FIRST.
    b0="${gw_hex%??????}"
    tmp="${gw_hex#??}";   b1="${tmp%????}"
    tmp="${gw_hex#????}"; b2="${tmp%??}"
    b3="${gw_hex#??????}"
    LOOMA_METRICBEAT_MONGO_HOST="$((0x$b3)).$((0x$b2)).$((0x$b1)).$((0x$b0))"
    echo "docker-entrypoint-wrapper: LOOMA_METRICBEAT_MONGO_HOST=auto resolved to $LOOMA_METRICBEAT_MONGO_HOST" >&2
  else
    echo "docker-entrypoint-wrapper: could not read a default route from /proc/net/route; leaving LOOMA_METRICBEAT_MONGO_HOST=auto (the mongodb module will fail to resolve it and just report a connection error, same as before this fix)." >&2
  fi
  export LOOMA_METRICBEAT_MONGO_HOST
fi

exec /usr/local/bin/docker-entrypoint "$@"
