/**
 * PostgreSQL Database Connection Pool
 * ═══════════════════════════════════════════════════════════════════════════
 * Based on System Architecture Design Document - Section 6.1
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides connection pooling for PostgreSQL database operations.
 * Implements patterns from Architecture Document:
 * - Connection pooling (like PgBouncer in production)
 * - Automatic reconnection on connection loss
 * - Query timeout to prevent hanging
 * - Health check capabilities
 * 
 * LOCAL DEVELOPMENT - No cloud required!
 * 
 * Usage:
 *   const { getPgPool, testConnection } = require('./config/db');
 *   const pool = getPgPool();
 *   const result = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
 */

const { Pool } = require('pg');
const config = require('./index');

let pool = null;

// ═══════════════════════════════════════════════════════════════════════════
// POOL CONFIGURATION (from Architecture Document Section 6.1)
// ═══════════════════════════════════════════════════════════════════════════
const POOL_CONFIG = {
  // Pool sizing (adjust based on your machine)
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  max: parseInt(process.env.DB_POOL_MAX) || 20,
  
  // Timeouts
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000,
  
  // Query timeouts
  query_timeout: 15000,
  statement_timeout: 15000,
  
  // Keep connections alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};

/**
 * Get PostgreSQL connection pool instance (singleton)
 * @returns {Pool} PostgreSQL connection pool
 */
function getPgPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: config.POSTGRES_URL,
      ...POOL_CONFIG,
      
      // SSL configuration (disable for local development)
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Handle pool errors (prevents app crash)
    pool.on('error', (err, client) => {
      console.error('🔴 Unexpected database pool error:', err.message);
    });

    pool.on('connect', (client) => {
      console.log('🟢 Database: New client connected to pool');
    });

    pool.on('acquire', (client) => {
      // Client acquired from pool (verbose logging)
      // console.log('📥 Database: Client acquired from pool');
    });

    pool.on('remove', (client) => {
      console.log('📤 Database: Client removed from pool');
    });
  }
  
  return pool;
}

/**
 * Test database connection with detailed diagnostics
 * @returns {Promise<boolean>} True if connection successful
 */
async function testConnection() {
  try {
    const pool = getPgPool();
    const start = Date.now();
    
    // Test query
    const result = await pool.query(`
      SELECT 
        1 as test, 
        NOW() as server_time,
        current_database() as database,
        current_user as user,
        version() as version
    `);
    const duration = Date.now() - start;
    
    console.log(`✅ Database connection successful (${duration}ms)`);
    console.log(`   Database: ${result.rows[0].database}`);
    console.log(`   User: ${result.rows[0].user}`);
    console.log(`   Server time: ${result.rows[0].server_time}`);
    
    // Log PostgreSQL version (abbreviated)
    const versionMatch = result.rows[0].version.match(/PostgreSQL (\d+\.\d+)/);
    if (versionMatch) {
      console.log(`   PostgreSQL: ${versionMatch[1]}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('   Make sure PostgreSQL is running:');
    console.error('   docker-compose -f docker-compose.dev.yml up -d postgres');
    
    if (config.POSTGRES_URL) {
      // Hide password in logs
      console.error(`   Connection: ${config.POSTGRES_URL.replace(/\/\/.*@/, '//***:***@')}`);
    }
    
    return false;
  }
}

/**
 * Get pool statistics for monitoring
 * From Architecture Document Section 12 - Monitoring
 */
function getPoolStats() {
  if (!pool) return null;
  
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
}

/**
 * Execute query with automatic error handling
 * Wrapper for common query patterns
 */
async function query(text, params) {
  const pool = getPgPool();
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.warn(`⚠️  Slow query (${duration}ms):`, text.substring(0, 100));
    }
    
    return result;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    console.error('   Query:', text.substring(0, 200));
    throw error;
  }
}

/**
 * Close database pool gracefully
 * @returns {Promise<void>}
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('📤 Database pool closed');
  }
}

module.exports = {
  getPgPool,
  testConnection,
  closePool,
  getPoolStats,
  query
};
