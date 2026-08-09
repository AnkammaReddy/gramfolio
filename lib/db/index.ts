import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: 1,
  max: 10,
  idleTimeoutMillis: 30_000,
})

export const db = drizzle(pool, { schema })

// Warm-up: wake the Neon compute endpoint at module load so the
// first real request doesn't pay the cold-start penalty (~500 ms).
pool.connect()
  .then((client) => {
    client.query("SELECT 1").then(() => client.release()).catch(() => client.release())
  })
  .catch((err) => {
    console.error("[db] warm-up ping failed:", err.message)
  })
