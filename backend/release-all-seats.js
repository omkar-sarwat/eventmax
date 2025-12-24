const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5434,
  database: 'eventmax',
  user: 'postgres',
  password: 'password'
});

async function releaseAllSeats() {
  try {
    const result = await pool.query(`
      UPDATE seats 
      SET status = 'available', 
          reserved_by = NULL, 
          reserved_until = NULL, 
          reservation_token = NULL 
      WHERE status = 'reserved'
    `);
    console.log('✅ Released', result.rowCount, 'reserved seats');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

releaseAllSeats();
