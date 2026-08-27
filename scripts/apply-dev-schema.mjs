#!/usr/bin/env node
/**
 * Idempotent apply of scripts/dev-schema.sql using node-postgres.
 * Used when psql is unavailable or when install.sh targets an external DATABASE_URL.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, "..")

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  const envLocal = readFileSync(join(repoRoot, ".env.local"), "utf8")
  const match = envLocal.match(/^DATABASE_URL=(.*)$/m)
  if (!match) throw new Error("DATABASE_URL not set")
  return match[1]
}

const sql = readFileSync(join(repoRoot, "scripts/dev-schema.sql"), "utf8")
const pool = new pg.Pool({ connectionString: loadDatabaseUrl() })

try {
  await pool.query(sql)
  console.log("[apply-dev-schema] Schema applied successfully.")
} catch (err) {
  console.error("[apply-dev-schema] Failed:", err.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
