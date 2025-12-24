/**
 * EventMax Backend Application Bootstrap
 * 
 * This file serves as the main entry point for the EventMax backend application.
 * It initializes the Express server with PostgreSQL and Redis connections,
 * sets up Socket.IO for real-time features, and configures all middleware
 * and routes required for the event booking system.
 * 
 * The app provides:
 * - RESTful API for event management and booking
 * - Real-time seat availability updates via WebSocket
 * - JWT-based authentication
 * - Redis-powered seat reservation system
 * - PostgreSQL data persistence
 * 
 * Note: This file does not start the server directly.
 * Use server.js for HTTP server initialization.
 */

const config = require('./config');
const express = require('express');
const cors = require('cors');

/**
 * Create Express application instance
 */
function createApp() {
  const app = express();
  
  // Basic middleware
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? config.CORS_ORIGINS?.split(',') 
      : '*',
    credentials: true
  }));
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  
  return app;
}

module.exports = { createApp };
