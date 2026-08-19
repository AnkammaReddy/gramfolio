#!/usr/bin/env bash
# Per-boot runtime reconciliation for GramFolio.
# Starts the local PostgreSQL cluster (idempotent) and waits for readiness.
# When an external DATABASE_URL is configured (e.g. a Neon dev branch), there is
# no local server to start, so this is a no-op.
# Dependency installation and schema setup live in install.sh, not here.
set -euo pipefail

PG_VERSION=16
PG_CLUSTER=main
DB_HOST=127.0.0.1
DB_PORT=5432

# Detect an external DB from the environment or from .env.local written by install.sh.
DB_URL="${DATABASE_URL:-}"
if [ -z "$DB_URL" ] && [ -f .env.local ]; then
  DB_URL="$(grep -E '^DATABASE_URL=' .env.local | head -n1 | cut -d= -f2- || true)"
fi

case "$DB_URL" in
  *"@$DB_HOST:$DB_PORT/"*|*"@localhost:$DB_PORT/"*|"")
    : # local database — start it below
    ;;
  *)
    echo "[start] External DATABASE_URL configured — skipping local Postgres startup."
    exit 0
    ;;
esac

if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1; then
  echo "[start] Starting PostgreSQL cluster..."
  sudo pg_ctlcluster "$PG_VERSION" "$PG_CLUSTER" start || true
fi

for _ in $(seq 1 30); do
  if pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1; then
    echo "[start] PostgreSQL is ready on $DB_HOST:$DB_PORT."
    exit 0
  fi
  sleep 1
done

echo "[start] PostgreSQL did not become ready in time." >&2
exit 1
