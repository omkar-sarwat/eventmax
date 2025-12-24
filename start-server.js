/**
 * Direct server startup script to bypass complex initialization
 */

const express = require('express');
const cors = require('cors');
const { getPgPool } = require('./backend/src/config/db');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ultra-fast health endpoint
app.get('/api/v1/ultra-fast/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Quick database ping
    const pool = getPgPool();
    await pool.query('SELECT 1');
    
    const latency = Date.now() - startTime;
    
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      latency,
      timestamp: new Date().toISOString(),
      mode: 'ultra-fast-direct'
    });
    
  } catch (error) {
    const latency = Date.now() - startTime;
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      latency,
      timestamp: new Date().toISOString()
    });
  }
});

// Ultra-fast events endpoint
app.get('/api/v1/ultra-fast/events', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const pool = getPgPool();
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    
    const query = `
      SELECT 
        e.id, e.title, e.description, e.start_time, e.end_time,
        e.venue_id, e.total_seats, e.available_seats, e.price
      FROM events e
      WHERE e.status = 'active'
      ORDER BY e.start_time ASC 
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    const latency = Date.now() - startTime;
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      latency,
      source: 'database'
    });
    
  } catch (error) {
    const latency = Date.now() - startTime;
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
      latency,
      message: error.message
    });
  }
});

// Ultra-fast event details
app.get('/api/v1/ultra-fast/events/:id', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const pool = getPgPool();
    const eventId = req.params.id;
    
    const query = `
      SELECT 
        e.id, e.title, e.description, e.start_time, e.end_time,
        e.venue_id, e.total_seats, e.available_seats, e.price
      FROM events e
      WHERE e.id = $1 AND e.status = 'active'
    `;
    
    const result = await pool.query(query, [eventId]);
    const latency = Date.now() - startTime;
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        latency
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      latency,
      source: 'database'
    });
    
  } catch (error) {
    const latency = Date.now() - startTime;
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event details',
      latency,
      message: error.message
    });
  }
});

// Ultra-fast seat status
app.get('/api/v1/ultra-fast/events/:id/seats', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const pool = getPgPool();
    const eventId = req.params.id;
    
    const query = `
      SELECT seat_label, status, reserved_by, reserved_until, price
      FROM seats 
      WHERE event_id = $1
      ORDER BY seat_label
    `;
    
    const result = await pool.query(query, [eventId]);
    const latency = Date.now() - startTime;
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      latency,
      source: 'database'
    });
    
  } catch (error) {
    const latency = Date.now() - startTime;
    res.status(500).json({
      success: false,
      error: 'Failed to fetch seat information',
      latency,
      message: error.message
    });
  }
});

// Ultra-fast seat lock
app.post('/api/v1/ultra-fast/seats/lock', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { eventId, seatLabels, userId } = req.body;
    
    if (!eventId || !seatLabels || !userId) {
      return res.status(400).json({
        success: false,
        error: 'eventId, seatLabels, and userId are required',
        latency: Date.now() - startTime
      });
    }
    
    const pool = getPgPool();
    
    const query = `
      UPDATE seats 
      SET status = 'reserved', reserved_by = $1, reserved_until = NOW() + INTERVAL '15 minutes'
      WHERE event_id = $2 AND seat_label = ANY($3) AND status = 'available'
      RETURNING seat_label, status
    `;
    
    const result = await pool.query(query, [userId, eventId, seatLabels]);
    const latency = Date.now() - startTime;
    
    res.json({
      success: true,
      data: {
        lockedSeats: result.rows,
        lockCount: result.rows.length,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      },
      latency
    });
    
  } catch (error) {
    const latency = Date.now() - startTime;
    res.status(500).json({
      success: false,
      error: 'Failed to lock seats',
      latency,
      message: error.message
    });
  }
});

// Ultra-fast seat release
app.post('/api/v1/ultra-fast/seats/release', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { eventId, seatLabels, userId } = req.body;
    
    if (!eventId || !seatLabels || !userId) {
      return res.status(400).json({
        success: false,
        error: 'eventId, seatLabels, and userId are required',
        latency: Date.now() - startTime
      });
    }
    
    const pool = getPgPool();
    
    const query = `
      UPDATE seats 
      SET status = 'available', reserved_by = NULL, reserved_until = NULL
      WHERE event_id = $1 AND seat_label = ANY($2) AND reserved_by = $3
      RETURNING seat_label, status
    `;
    
    const result = await pool.query(query, [eventId, seatLabels, userId]);
    const latency = Date.now() - startTime;
    
    res.json({
      success: true,
      data: {
        releasedSeats: result.rows,
        releaseCount: result.rows.length
      },
      latency
    });
    
  } catch (error) {
    const latency = Date.now() - startTime;
    res.status(500).json({
      success: false,
      error: 'Failed to release seats',
      latency,
      message: error.message
    });
  }
});

// Ultra-fast performance stats
app.get('/api/v1/ultra-fast/stats', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const latency = Date.now() - startTime;
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      target: '< 20ms',
      mode: 'ULTRA_FAST_DIRECT',
      latency
    });
    
  } catch (error) {
    const latency = Date.now() - startTime;
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance statistics',
      latency,
      message: error.message
    });
  }
});

// Legacy health check
app.get('/api/v1/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const pool = getPgPool();
    await pool.query('SELECT 1');
    
    const latency = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      database: 'connected',
      latency,
      timestamp: new Date().toISOString(),
      mode: 'direct'
    });
    
  } catch (error) {
    const latency = Date.now() - startTime;
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      latency,
      timestamp: new Date().toISOString()
    });
  }
});

// Legacy events
app.get('/api/v1/events', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const pool = getPgPool();
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    
    const query = `
      SELECT 
        e.id, e.title, e.description, e.start_time, e.end_time,
        e.venue_id, e.total_seats, e.available_seats, e.price
      FROM events e
      WHERE e.status = 'active'
      ORDER BY e.start_time ASC 
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    const latency = Date.now() - startTime;
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      latency
    });
    
  } catch (error) {
    const latency = Date.now() - startTime;
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
      latency,
      message: error.message
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 EventMax Direct Server running on port ${port}`);
  console.log(`🔗 Health Check: http://localhost:${port}/api/v1/ultra-fast/health`);
  console.log(`⚡ Ultra-Fast Mode: Target <20ms latency`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});
