import pg from 'pg'

const { Pool } = pg

const prodPool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_CB3vKXLNAa1n@ep-wandering-river-atzfzco8-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require',
})

const devPool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_CB3vKXLNAa1n@ep-wandering-river-atzfzco8-pooler.c-9.us-east-1.aws.neon.tech/dev?sslmode=require',
})

async function syncTodev() {
  try {
    console.log('[v0] Connecting to production and dev databases...')

    // Get list of tables to copy (user data only, not auth tables)
    const tablesResult = await prodPool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name NOT LIKE 'verification%'
      ORDER BY table_name
    `)

    const tables = tablesResult.rows.map(r => r.table_name)
    console.log(`[v0] Found ${tables.length} tables to sync: ${tables.join(', ')}`)

    for (const tableName of tables) {
      try {
        // Get all data from production
        const dataResult = await prodPool.query(`SELECT * FROM "${tableName}"`)
        const rows = dataResult.rows

        if (rows.length === 0) {
          console.log(`[v0] ${tableName}: empty, skipping`)
          continue
        }

        // Clear dev table
        await devPool.query(`TRUNCATE TABLE "${tableName}" CASCADE`)

        // Get column info
        const columnsResult = await prodPool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [tableName])

        const columns = columnsResult.rows.map(r => r.column_name)

        // Insert rows into dev
        for (const row of rows) {
          const values = columns.map(col => row[col])
          const columnList = columns.map(c => `"${c}"`).join(',')
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(',')

          await devPool.query(
            `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`,
            values
          )
        }

        console.log(`[v0] ${tableName}: synced ${rows.length} rows`)
      } catch (err) {
        console.error(`[v0] Error syncing ${tableName}:`, err.message)
      }
    }

    console.log('[v0] ✓ All data synced from production to dev')
  } catch (error) {
    console.error('[v0] Fatal error:', error.message)
  } finally {
    await prodPool.end()
    await devPool.end()
  }
}

syncTodev()
