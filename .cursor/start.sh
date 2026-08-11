#!/usr/bin/env bash
# Per-boot runtime reconciliation for GramFolio.
# Starts the local PostgreSQL cluster (idempotent) and waits for readiness.
# Dependency installation and schema setup live in install.sh, not here.
set -euo pipefail

PG_VERSION=16
PG_CLUSTER=main
DB_HOST=127.0.0.1
DB_PORT=5432

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
