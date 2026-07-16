FROM clickhouse/clickhouse-server:24.8

# Bake Coroot's ClickHouse config overrides INTO the image instead of
# bind-mounting them from the host. Single-file bind mounts are fragile on
# Docker Desktop / WSL2: when the host file's inode changes (an edit, a rebuild,
# or the WSL2 mount layer hiccuping) the mount goes stale and ClickHouse's
# ConfigReloader crashes on every scan with:
#   filesystem error: in posix_stat: failed to determine attributes ...
#   No such device ["/etc/clickhouse-server/config.d/listen-ipv4.xml"]
# Baking the files makes the stack immune to that (same pattern Looma already
# uses for the retention/bootstrap sidecars).
COPY coroot-logging.xml coroot-user-logging.xml listen-ipv4.xml /etc/clickhouse-server/config.d/
