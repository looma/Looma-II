#!/usr/bin/env bash
#
# sync-to-external-disk.sh — mirrors this repo's working tree onto the
# external disk you run the odroid installer from ("the disk IS the
# installer" — see deploy/odroid/README-ODROID.md). Run manually any time, or
# let the post-commit hook (.githooks/post-commit) call it after every commit
# so the disk never drifts from what you actually have here.
#
# Never fails/blocks anything: if the disk isn't plugged in or its Looma
# folder isn't found, this just says so and exits 0 — a git commit must never
# be held up by a USB stick not being present.
#
# SAFETY: only ever looks under /run/media/$USER and /media/$USER — actual
# removable-media mount points on this system, udisksctl's own convention.
# /mnt is DELIBERATELY never scanned: on this machine it holds fixed internal
# data disks (the observability data-server's /mnt/looma, among others), and
# an early version of this script that also scanned /mnt matched /mnt/looma
# itself (its own basename happened to satisfy a "looma*" glob) and ran
# `rsync --delete` against the OBSERVABILITY DATA DISK. It failed harmlessly
# that time only because of a UID mismatch — do not re-add /mnt here.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_REPO="$(cd "$SCRIPT_DIR/.." && pwd)"

# Where to look for the disk's copy. LOOMA_DISK_TARGET overrides everything
# (an exact path — created if it doesn't exist yet, still subject to the
# same-repo check below if it already has content). Otherwise, scan every
# mounted removable disk for an EXISTING repo checkout — found by its own
# root marker (looma-TTS.php), not by folder name, since that folder has been
# named differently across disks ("Looma", "Looma32", …) and README-ODROID.md
# documents it nested one level (<disk>/Looma/Looma/, content/ etc. as
# <disk>/Looma/'s siblings) — a name-based guess would miss that layout.
find_target() {
  if [ -n "${LOOMA_DISK_TARGET:-}" ]; then
    echo "$LOOMA_DISK_TARGET"
    return 0
  fi

  local base d hit
  for base in "/run/media/$USER" "/media/$USER"; do
    [ -d "$base" ] || continue
    hit="$(find "$base" -mindepth 1 -maxdepth 4 -iname 'looma-TTS.php' 2>/dev/null | head -n1)"
    if [ -n "$hit" ]; then
      dirname "$hit"
      return 0
    fi
  done

  # No existing copy anywhere — the documented layout: <disk>/Looma/Looma/ is
  # the repo, <disk>/Looma/ holds its siblings (content/, Dockerfile.piper, …
  # — this script only ever syncs the repo half, never those).
  for base in "/run/media/$USER" "/media/$USER"; do
    [ -d "$base" ] || continue
    for d in "$base"/*/; do
      [ -d "$d" ] && [ -w "$d" ] || continue
      echo "${d%/}/Looma/Looma"
      return 0
    done
  done

  return 1
}

TARGET="$(find_target)" || {
  echo "[sync-to-external-disk] no external disk mounted right now — skipping (this is fine, not an error)."
  exit 0
}

# Refuse to touch a target that already has content unless it looks like a
# Looma checkout (or is a bind-mount-style empty dir) — never risk --delete
# against a folder that turned out to be something else. looma-TTS.php is
# the same marker the installer itself checks for a valid repo.
if [ -e "$TARGET" ] && [ -n "$(ls -A "$TARGET" 2>/dev/null)" ] && [ ! -e "$TARGET/looma-TTS.php" ]; then
  echo "[sync-to-external-disk] REFUSING: $TARGET exists, is not empty, and doesn't look like a Looma checkout" >&2
  echo "  (no looma-TTS.php in it) — not touching it. Set LOOMA_DISK_TARGET to the right path." >&2
  exit 1
fi

echo "[sync-to-external-disk] $SRC_REPO -> $TARGET"
mkdir -p "$TARGET" || {
  echo "[sync-to-external-disk] WARN: could not create $TARGET (disk read-only or disconnected mid-sync?) — skipping." >&2
  exit 0
}

# Same exclude set the installer itself already uses when copying the repo
# onto a box (see install_deploy_docker/native): skip what's either huge,
# regenerable, or meaningless off this machine. .git IS kept — it's small,
# and lets you check what commit the disk is on (git -C <disk>/Looma log -1).
if ! rsync -a --delete \
    --exclude '**/.venv/' --exclude '**/__pycache__/' --exclude '**/node_modules/' \
    --exclude 'deploy/odroid/offline/' --exclude 'deploy/odroid/native-bundle/' \
    "$SRC_REPO/" "$TARGET/"; then
  echo "[sync-to-external-disk] WARN: rsync reported an error (disk unplugged mid-sync?) — the disk copy may be incomplete." >&2
  exit 0
fi

echo "[sync-to-external-disk] done ($(git -C "$SRC_REPO" rev-parse --short HEAD 2>/dev/null || echo '?'))."
