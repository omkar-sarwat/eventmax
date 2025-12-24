/**
 * PostgreSQL Database Connection Pool
 */
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5434,
    database: process.env.DB_NAME || 'eventmax',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
});

// Test connection on startup
pool.query('SELECT NOW()')
    .then(() => console.log('✅ Database connected'))
    .catch(err => console.error('❌ Database connection failed:', err.message));

module.exports = pool;
