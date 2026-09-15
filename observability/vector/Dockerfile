FROM timberio/vector:0.37.1-debian

COPY vector.toml /etc/vector/vector.toml
# Agent role (odroid, remote-agents mode) — selected via LOOMA_VECTOR_CONFIG,
# see docker-compose.yml's vector service and looma-installer.sh cmd_up().
COPY vector-agent.toml /etc/vector/vector-agent.toml
