const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:O7zOQFYPu8h8@ep-delicate-morning-33231511.us-east-1.neon.tech/neondb?sslmode=require'
});

(async () => {
  try {
    const res = await pool.query('DELETE FROM "user" WHERE email = $1', ['testuser@example.com']);
    console.log('✓ Deleted rows:', res.rowCount);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();
