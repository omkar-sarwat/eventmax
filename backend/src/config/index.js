const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env files
const envPath = path.resolve(__dirname, '..', '..', '..', '.env.docker');
dotenv.config({ path: envPath });

// Also try loading from root .env if exists  
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

// Configuration function that builds config dynamically
function getConfig() {
  return {
    // Application settings
    NODE_ENV: process.env.NODE_ENV || 'development',
    BACKEND_PORT: parseInt(process.env.BACKEND_PORT) || parseInt(process.env.PORT) || 4000,
    
    // Database configuration
    POSTGRES_URL: process.env.POSTGRES_URL || 
      `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'password'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5434}/${process.env.POSTGRES_DB || 'eventmax'}`,
    
    // Redis configuration
    REDIS_URL: process.env.REDIS_URL || 
      `redis://:${process.env.REDIS_PASSWORD || ''}@${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    
    // CORS settings
    CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173',
    
    // JWT settings
    jwt: {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
      expiresIn: process.env.JWT_EXPIRY || '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '7d'
    },
    
    // CORS configuration
    cors: {
      origin: function(origin, callback) {
        const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',');
        if ((process.env.NODE_ENV || 'development') !== 'production' || !origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true
    },
    
    // Application settings
    app: {
      env: process.env.NODE_ENV || 'development',
      maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb'
    },
    
    // Booking settings
    booking: {
      reservationTTL: parseInt(process.env.BOOKING_RESERVATION_TTL) || 300, // 5 minutes
      minCancellationHours: parseInt(process.env.MIN_CANCELLATION_HOURS) || 24
    }
  };
}

// Configuration object created AFTER environment is loaded
const config = getConfig();

// Validate required configuration
function validateConfig() {
  const required = ['POSTGRES_URL', 'REDIS_URL'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing configuration: ${missing.join(', ')}`);
    console.warn('   Using defaults, but some features may not work correctly.');
  }
}

// Validate on load
validateConfig();

// Log configuration in development (without sensitive data)
if (config.NODE_ENV === 'development') {
  console.log('📋 Configuration loaded:');
  console.log(`   Environment: ${config.NODE_ENV}`);
  console.log(`   Port: ${config.BACKEND_PORT}`);
  console.log(`   Database: ${config.POSTGRES_URL.replace(/\/\/.*@/, '//***:***@')}`);
  console.log(`   Redis: ${config.REDIS_URL.replace(/:.*@/, ':***@')}`);
}

module.exports = config;
