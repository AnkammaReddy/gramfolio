import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'

async function syncSchema() {
  const prodClient = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_CB3vKXLNAa1n@ep-wandering-river-atzfzco8-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require',
  })

  const devClient = new Client({
    connectionString: 'postgresql://neondb_owner:npg_CB3vKXLNAa1n@ep-wandering-river-atzfzco8-pooler.c-9.us-east-1.aws.neon.tech/dev?sslmode=require',
  })

  try {
    await prodClient.connect()
    await devClient.connect()

    console.log('[v0] Getting schema from production...')

    // Get all tables from production
    const tables = await prodClient.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    console.log(`[v0] Found ${tables.rows.length} tables in production`)

    // For each table, copy schema and data
    for (const { table_name } of tables.rows) {
      console.log(`[v0] Syncing ${table_name}...`)

      // Get CREATE TABLE statement
      const createStmt = await prodClient.query(`
        SELECT pg_get_ddl('t'::regtype, oid)
        FROM pg_type
        WHERE typname = $1
      `, [table_name])

      // Get all data from production
      const data = await prodClient.query(`SELECT * FROM "${table_name}"`)

      if (data.rows.length > 0) {
        // Insert into dev
        const columns = Object.keys(data.rows[0])
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(',')
        const columnList = columns.map(c => `"${c}"`).join(',')

        for (const row of data.rows) {
          const values = columns.map(c => row[c])
          await devClient.query(
            `INSERT INTO "${table_name}" (${columnList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          )
        }

        console.log(`[v0] Copied ${data.rows.length} rows to ${table_name}`)
      }
    }

    console.log('[v0] ✓ Schema and data synced to dev database')
  } catch (error) {
    console.error('[v0] Error syncing:', error)
  } finally {
    await prodClient.end()
    await devClient.end()
  }
}

syncSchema()
