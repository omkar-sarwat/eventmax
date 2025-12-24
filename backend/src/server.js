/**
 * EventMax Express Server
 * 
 * Main HTTP server with Express.js, PostgreSQL, Redis, and Socket.IO integration.
 * Provides REST API endpoints and real-time WebSocket communication.
 */

const http = require('http');
const express = require('express');
const path = require('path');
const config = require('./config');
const { getPgPool, testConnection: testDb } = require('./config/db');
const { getRedis, testConnection: testRedis } = require('./config/redis');
const { attachSocket } = require('./ws/socket');

// Initialize Express app
const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = config.CORS_ORIGINS.split(',');
  
  if (config.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Serve API documentation
app.use('/docs', express.static(path.join(__dirname, '../docs')));

// Import and use API routes
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// Additional health endpoints at root level
app.get('/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'pong', 
    timestamp: new Date().toISOString() 
  });
});

app.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'EventMax API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/metrics', (req, res) => {
  res.json({
    success: true,
    data: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
      version: process.version,
      timestamp: new Date().toISOString()
    }
  });
});

// Health check endpoint with database and Redis status
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db: 'unknown',
    redis: 'unknown'
  };

  // Test database connection (non-blocking)
  try {
    const dbConnected = await Promise.race([
      testDb(),
      new Promise(resolve => setTimeout(() => resolve(false), 1000))
    ]);
    health.db = dbConnected ? 'ok' : 'down';
  } catch (error) {
    health.db = 'down';
  }

  // Test Redis connection (non-blocking)
  try {
    const redisConnected = await Promise.race([
      testRedis(),
      new Promise(resolve => setTimeout(() => resolve(false), 1000))
    ]);
    health.redis = redisConnected ? 'ok' : 'down';
  } catch (error) {
    health.redis = 'down';
  }

  res.json(health);
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'EventMax API',
    version: '1.0.0',
    documentation: '/docs/api.yaml',
    endpoints: {
      health: '/health',
      events: '/api/events',
      bookings: '/api/bookings',
      auth: '/api/auth',
      admin: '/api/admin'
    }
  });
});

// Stats endpoint for dashboard data
app.get('/api/stats', async (req, res) => {
  try {
    // Placeholder stats data
    res.json({
      success: true,
      data: {
        eventsCount: 42,
        upcomingEvents: 18,
        ticketsSold: 1250,
        activeUsers: 320,
        recentBookings: [
          { id: 'b1', eventName: 'Summer Festival', date: new Date().toISOString(), status: 'confirmed' },
          { id: 'b2', eventName: 'Tech Conference', date: new Date().toISOString(), status: 'confirmed' },
          { id: 'b3', eventName: 'Jazz Night', date: new Date().toISOString(), status: 'pending' }
        ],
        trending: [
          { id: 'e1', name: 'Summer Festival', ticketsSold: 500 },
          { id: 'e2', name: 'Tech Conference', ticketsSold: 320 },
          { id: 'e3', name: 'Jazz Night', ticketsSold: 180 }
        ]
      }
    });
  } catch (error) {
    console.error('Stats endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stats',
      message: error.message
    });
  }
});

// Compatibility layer for v1 API paths
app.use('/api/v1', (req, res, next) => {
  console.log(`🔄 [V1 COMPAT] Original URL: ${req.originalUrl}`);
  console.log(`🔄 [V1 COMPAT] Request URL: ${req.url}`);
  
  // Rewrite the URL to remove /v1 and redirect to main API routes
  const newPath = `/api${req.url}`;
  console.log(`🔄 [V1 COMPAT] Redirecting to: ${newPath}`);
  
  // Forward the request to the main API routes
  req.url = req.url; // Keep original URL for the redirect
  req.originalUrl = newPath; // Update original URL
  
  // Call the apiRoutes directly
  apiRoutes(req, res, next);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
      path: req.originalUrl
    }
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('🔴 Unhandled error:', error);
  
  res.status(error.status || 500).json({
    error: {
      message: config.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      code: error.code || 'INTERNAL_ERROR',
      ...(config.NODE_ENV !== 'production' && { stack: error.stack })
    }
  });
});

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO
const io = attachSocket(server);

// Initialize connections
async function initializeServices() {
  console.log('🚀 Initializing EventMax Backend...\n');
  
  // Test database connection
  console.log('📊 Testing database connection...');
  const dbConnected = await testDb();
  
  // Test Redis connection  
  console.log('🔴 Testing Redis connection...');
  const redisConnected = await testRedis();
  
  if (!dbConnected && !redisConnected) {
    console.log('\n⚠️  Both database and Redis are unavailable.');
    console.log('   API will start but functionality will be limited.');
    console.log('   Start dependencies with: docker-compose up db redis\n');
  } else if (!dbConnected) {
    console.log('\n⚠️  Database unavailable. Start with: docker-compose up db\n');
  } else if (!redisConnected) {
    console.log('\n⚠️  Redis unavailable. Start with: docker-compose up redis\n');
  } else {
    console.log('\n✅ All services connected successfully!\n');
  }
}

// Start server
async function startServer() {
  await initializeServices();
  
  const port = config.BACKEND_PORT;
  
  server.listen(port, () => {
    console.log(`🎉 API running on port ${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/docs/api.yaml`);
    console.log(`❤️  Health Check: http://localhost:${port}/health`);
    console.log(`🔌 WebSocket: ws://localhost:${port}\n`);
  });

  // Graceful shutdown
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

async function gracefulShutdown() {
  console.log('\n🛑 Graceful shutdown initiated...');
  
  server.close(() => {
    console.log('📤 HTTP server closed');
  });
  
  // Close database pool
  try {
    const { closePool } = require('./config/db');
    await closePool();
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
  
  // Close Redis connection
  try {
    const { closeRedis } = require('./config/redis');
    await closeRedis();
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  }
  
  console.log('👋 Shutdown complete');
  process.exit(0);
}

// Start server if this file is run directly
if (require.main === module) {
  startServer().catch(error => {
    console.error('🔴 Failed to start server:', error);
    process.exit(1);
  });
}

// Export for testing
module.exports = { app, server, io };
