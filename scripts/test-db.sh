#!/usr/bin/env bash
# Starts a throwaway Postgres 16, applies the Supabase stub and all migrations,
# and prints the DATABASE_URL for the RLS tests. Usage:
#   eval "$(scripts/test-db.sh)" && pnpm test:rls
set -euo pipefail
PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
DIR="${TEST_DB_DIR:-/tmp/taksit-test-pg}"
PORT="${TEST_DB_PORT:-54329}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Postgres refuses to run as root; use the postgres user when we are root.
AS=""
if [ "$(id -u)" = "0" ]; then AS="runuser -u postgres --"; fi
if [ -f "$DIR/postmaster.pid" ]; then $AS "$PG_BIN/pg_ctl" -D "$DIR" -m immediate stop >/dev/null 2>&1 || true; fi
rm -rf "$DIR"
mkdir -p "$DIR"
if [ -n "$AS" ]; then chown postgres "$DIR"; fi
$AS "$PG_BIN/initdb" -D "$DIR" -U postgres --auth=trust >/dev/null
$AS "$PG_BIN/pg_ctl" -D "$DIR" -o "-p $PORT -k /tmp -c listen_addresses=localhost" -l "$DIR/log" start >/dev/null
URL="postgres://postgres@localhost:$PORT/postgres"
psql "$URL" -q -v ON_ERROR_STOP=1 -f "$ROOT/supabase/tests/supabase_stub.sql" >/dev/null
for f in "$ROOT"/supabase/migrations/*.sql; do psql "$URL" -q -v ON_ERROR_STOP=1 -f "$f" >/dev/null; done
echo "export DATABASE_URL=$URL"
