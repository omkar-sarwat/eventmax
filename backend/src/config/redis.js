/**
 * Redis Client Configuration
 * ═══════════════════════════════════════════════════════════════════════════
 * Based on System Architecture Design Document - Section 5.2
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides Redis client for:
 * - Caching (event details, user sessions)
 * - Seat reservation management with distributed locks
 * - Rate limiting counters
 * - Session storage
 * 
 * LOCAL DEVELOPMENT - No cloud required!
 */

const Redis = require('ioredis');
const config = require('./index');

let redisClient = null;
let isConnected = false;

// ═══════════════════════════════════════════════════════════════════════════
// KEY PREFIXES (from Architecture Document Section 5.2)
// ═══════════════════════════════════════════════════════════════════════════
const KEY_PREFIXES = {
  SESSION: 'sess:',      // User sessions (TTL: 24h)
  USER: 'user:',         // User profiles (TTL: 1h)
  EVENT: 'event:',       // Event details (TTL: 5min)
  SEARCH: 'search:',     // Search results (TTL: 1min)
  SEAT: 'seat:',         // Seat availability (TTL: 10sec)
  LOCK: 'lock:',         // Distributed locks (TTL: 30sec)
  RATE: 'rate:',         // Rate limit counters (TTL: 1min)
  RESERVATION: 'res:'    // Seat reservations (TTL: 10min)
};

// TTL values in seconds
const TTL = {
  SESSION: 86400,        // 24 hours
  USER: 3600,            // 1 hour
  EVENT: 300,            // 5 minutes
  SEARCH: 60,            // 1 minute
  SEAT: 10,              // 10 seconds
  LOCK: 30,              // 30 seconds
  RATE: 60,              // 1 minute
  RESERVATION: 600       // 10 minutes (booking timeout)
};

/**
 * Get Redis client instance (singleton)
 */
function getRedis() {
  if (!redisClient) {
    const redisUrl = config.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = new Redis(redisUrl, {
      // Connection settings
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 10000,
      commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT) || 5000,
      
      // Reconnection strategy (from Architecture Document)
      retryStrategy: (times) => {
        if (times > 10) {
          console.error('🔴 Redis: Max reconnection attempts reached');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 100, 3000);
        console.log(`🔄 Redis reconnect attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
      
      // Connection name for debugging
      connectionName: 'eventmax-backend'
    });

    redisClient.on('connect', () => {
      console.log('🟢 Redis: Connection established');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis: Ready to accept commands');
    });

    redisClient.on('error', (err) => {
      console.error('🔴 Redis connection error:', err.message);
      isConnected = false;
    });

    redisClient.on('close', () => {
      console.log('📤 Redis: Connection closed');
      isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis: Reconnecting...');
    });
  }
  
  return redisClient;
}

/**
 * Check if Redis is connected
 */
function isRedisConnected() {
  return isConnected && redisClient && redisClient.status === 'ready';
}

/**
 * Test Redis connection
 */
async function testConnection() {
  try {
    const redis = getRedis();
    const start = Date.now();
    
    const pong = await redis.ping();
    const duration = Date.now() - start;
    
    if (pong === 'PONG') {
      console.log(`✅ Redis connection successful (${duration}ms)`);
      
      // Log Redis info
      const info = await redis.info('server');
      const versionMatch = info.match(/redis_version:(\S+)/);
      if (versionMatch) {
        console.log(`   Redis version: ${versionMatch[1]}`);
      }
      
      return true;
    } else {
      throw new Error('Invalid ping response');
    }
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.error('   Make sure Redis is running: docker-compose -f docker-compose.dev.yml up -d redis');
    return false;
  }
}

/**
 * Close Redis connection gracefully
 */
async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    console.log('📤 Redis connection closed');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CACHE HELPER FUNCTIONS (from Architecture Document Section 5.3)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get cached data with automatic JSON parsing
 */
async function getCache(key) {
  try {
    const redis = getRedis();
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Cache get error for ${key}:`, error.message);
    return null;
  }
}

/**
 * Set cached data with automatic JSON stringification
 */
async function setCache(key, data, ttlSeconds = 300) {
  try {
    const redis = getRedis();
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Cache set error for ${key}:`, error.message);
    return false;
  }
}

/**
 * Delete cached data
 */
async function deleteCache(key) {
  try {
    const redis = getRedis();
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`Cache delete error for ${key}:`, error.message);
    return false;
  }
}

/**
 * Acquire distributed lock (for seat reservation)
 * From Architecture Document - Section 3.3 (Circuit Breaker Pattern)
 */
async function acquireLock(lockKey, ttlSeconds = 30) {
  try {
    const redis = getRedis();
    const lockValue = `${Date.now()}-${Math.random()}`;
    const result = await redis.set(
      `${KEY_PREFIXES.LOCK}${lockKey}`,
      lockValue,
      'EX', ttlSeconds,
      'NX'
    );
    return result === 'OK' ? lockValue : null;
  } catch (error) {
    console.error(`Lock acquire error for ${lockKey}:`, error.message);
    return null;
  }
}

/**
 * Release distributed lock
 */
async function releaseLock(lockKey, lockValue) {
  try {
    const redis = getRedis();
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await redis.eval(script, 1, `${KEY_PREFIXES.LOCK}${lockKey}`, lockValue);
    return true;
  } catch (error) {
    console.error(`Lock release error for ${lockKey}:`, error.message);
    return false;
  }
}

module.exports = {
  getRedis,
  testConnection,
  closeRedis,
  isRedisConnected,
  // Cache helpers
  getCache,
  setCache,
  deleteCache,
  // Distributed locking
  acquireLock,
  releaseLock,
  // Constants
  KEY_PREFIXES,
  TTL
};

