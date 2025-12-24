/**
 * Middleware Index - Export all middleware functions
 */

const auth = require('./auth');
const rateLimit = require('./rateLimit');
const validation = require('./validation');
const errorHandling = require('./errorHandling');
const logging = require('./logging');

module.exports = {
  // Authentication middleware
  authenticate: auth.requireAuth(),
  optionalAuthenticate: auth.optionalAuth(),
  authorize: auth.requireRole,
  requireAdmin: auth.requireAdmin(),
  
  // Rate limiting
  rateLimits: rateLimit,
  
  // Validation
  validateRequest: validation.validation,
  
  // Error handling
  errorHandler: errorHandling.errorHandler,
  asyncErrorCatcher: errorHandling.asyncErrorCatcher,
  
  // Health check
  healthCheck: async (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
};