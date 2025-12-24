const winston = require('winston');
const path = require('path');
const fs = require('fs');

/**
 * EventMax Logging Middleware
 * Comprehensive logging system with multiple transports and structured logging
 * Provides request logging, performance monitoring, and security auditing
 */
class LoggingMiddleware {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
        this.isProduction = process.env.NODE_ENV === 'production';
        this.logger = this.createLogger();
    }

    /**
     * Create Winston logger with multiple transports
     * @private
     */
    createLogger() {
        // Ensure logs directory exists
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        // Define log format
        const logFormat = winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
            winston.format.prettyPrint()
        );

        // Console format for development
        const consoleFormat = winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                return `${timestamp} [${level}]: ${message} ${metaStr}`;
            })
        );

        const transports = [
            // Error log file
            new winston.transports.File({
                filename: path.join(logsDir, 'error.log'),
                level: 'error',
                format: logFormat,
                maxsize: 5242880, // 5MB
                maxFiles: 5,
                tailable: true
            }),

            // Combined log file
            new winston.transports.File({
                filename: path.join(logsDir, 'combined.log'),
                format: logFormat,
                maxsize: 5242880, // 5MB
                maxFiles: 5,
                tailable: true
            }),

            // Access log file
            new winston.transports.File({
                filename: path.join(logsDir, 'access.log'),
                level: 'info',
                format: logFormat,
                maxsize: 10485760, // 10MB
                maxFiles: 10,
                tailable: true
            })
        ];

        // Add console transport for development
        if (this.isDevelopment) {
            transports.push(
                new winston.transports.Console({
                    format: consoleFormat,
                    level: 'debug'
                })
            );
        }

        return winston.createLogger({
            level: this.isDevelopment ? 'debug' : 'info',
            format: logFormat,
            defaultMeta: {
                service: 'eventmax-api',
                environment: process.env.NODE_ENV || 'development'
            },
            transports,
            exitOnError: false
        });
    }

    /**
     * HTTP request logging middleware
     */
    requestLogger() {
        return (req, res, next) => {
            const startTime = Date.now();
            const startHrTime = process.hrtime();

            // Store original res.json to intercept response
            const originalJson = res.json;
            let responseBody = null;

            res.json = function(body) {
                responseBody = body;
                return originalJson.call(this, body);
            };

            // Store original res.send to intercept response
            const originalSend = res.send;
            res.send = function(body) {
                if (!responseBody) {
                    responseBody = body;
                }
                return originalSend.call(this, body);
            };

            // Log request completion
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                const hrDuration = process.hrtime(startHrTime);
                const durationMs = hrDuration[0] * 1000 + hrDuration[1] * 1e-6;

                const logData = {
                    type: 'http_request',
                    requestId: req.requestId,
                    method: req.method,
                    url: req.originalUrl,
                    path: req.path,
                    statusCode: res.statusCode,
                    duration: Math.round(durationMs),
                    userAgent: req.headers['user-agent'],
                    ip: this.getClientIP(req),
                    userId: req.user?.id,
                    userRole: req.user?.role,
                    contentLength: res.get('content-length'),
                    referer: req.headers.referer,
                    query: this.sanitizeData(req.query),
                    params: req.params,
                    timestamp: new Date().toISOString()
                };

                // Add response details for errors
                if (res.statusCode >= 400) {
                    logData.error = true;
                    if (responseBody && typeof responseBody === 'object') {
                        logData.errorCode = responseBody.code;
                        logData.errorMessage = responseBody.message;
                    }
                }

                // Add performance warnings
                if (durationMs > 5000) {
                    logData.performance = 'slow';
                    logData.warning = 'Request took longer than 5 seconds';
                }

                // Log based on status code
                if (res.statusCode >= 500) {
                    this.logger.error('HTTP Request - Server Error', logData);
                } else if (res.statusCode >= 400) {
                    this.logger.warn('HTTP Request - Client Error', logData);
                } else {
                    this.logger.info('HTTP Request', logData);
                }
            });

            next();
        };
    }

    /**
     * Database query logging
     */
    databaseLogger() {
        return {
            logQuery: (query, duration, error = null) => {
                const logData = {
                    type: 'database_query',
                    query: query.sql || query.text || query,
                    duration: Math.round(duration),
                    timestamp: new Date().toISOString()
                };

                if (error) {
                    logData.error = error.message;
                    logData.errorCode = error.code;
                    this.logger.error('Database Query Error', logData);
                } else {
                    if (duration > 1000) {
                        logData.performance = 'slow';
                        logData.warning = 'Query took longer than 1 second';
                        this.logger.warn('Database Query - Slow', logData);
                    } else {
                        this.logger.debug('Database Query', logData);
                    }
                }
            }
        };
    }

    /**
     * Authentication event logging
     */
    authLogger() {
        return (req, res, next) => {
            // Store original res.json to intercept response
            const originalJson = res.json;
            
            res.json = function(body) {
                // Log authentication events
                if (req.path.includes('/auth/') || req.path.includes('/login') || req.path.includes('/register')) {
                    const logData = {
                        type: 'authentication',
                        action: this.getAuthAction(req.path),
                        requestId: req.requestId,
                        ip: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip,
                        userAgent: req.headers['user-agent'],
                        email: req.body?.email,
                        success: res.statusCode < 400,
                        statusCode: res.statusCode,
                        timestamp: new Date().toISOString()
                    };

                    if (!logData.success && body) {
                        logData.errorCode = body.code;
                        logData.errorMessage = body.message;
                    }

                    if (logData.success) {
                        if (body?.user) {
                            logData.userId = body.user.id;
                            logData.userRole = body.user.role;
                        }
                        req.logger.info('Authentication Success', logData);
                    } else {
                        req.logger.warn('Authentication Failed', logData);
                    }
                }

                return originalJson.call(this, body);
            }.bind(this);

            req.logger = this.logger;
            next();
        };
    }

    /**
     * Security event logging
     */
    securityLogger() {
        return (req, res, next) => {
            // Monitor suspicious activities
            const suspiciousPatterns = [
                /\.\.\//, // Path traversal
                /<script/, // XSS attempts
                /union.*select/i, // SQL injection
                /javascript:/i, // JavaScript injection
                /eval\s*\(/i, // Code evaluation
                /base64_decode/i // Base64 decode attempts
            ];

            const fullUrl = req.originalUrl;
            const bodyStr = JSON.stringify(req.body || {});
            
            const isSuspicious = suspiciousPatterns.some(pattern => 
                pattern.test(fullUrl) || pattern.test(bodyStr)
            );

            if (isSuspicious) {
                const logData = {
                    type: 'security_threat',
                    threat: 'suspicious_request',
                    requestId: req.requestId,
                    method: req.method,
                    url: req.originalUrl,
                    ip: this.getClientIP(req),
                    userAgent: req.headers['user-agent'],
                    userId: req.user?.id,
                    body: this.sanitizeData(req.body),
                    query: this.sanitizeData(req.query),
                    timestamp: new Date().toISOString()
                };

                this.logger.warn('Security Threat Detected', logData);
            }

            next();
        };
    }

    /**
     * Performance monitoring middleware
     */
    performanceLogger() {
        return (req, res, next) => {
            const startTime = process.hrtime.bigint();
            const startMemory = process.memoryUsage();

            res.on('finish', () => {
                const endTime = process.hrtime.bigint();
                const endMemory = process.memoryUsage();
                const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds

                const memoryDelta = {
                    rss: endMemory.rss - startMemory.rss,
                    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                    heapTotal: endMemory.heapTotal - startMemory.heapTotal,
                    external: endMemory.external - startMemory.external
                };

                const logData = {
                    type: 'performance',
                    requestId: req.requestId,
                    method: req.method,
                    url: req.originalUrl,
                    duration: Math.round(duration),
                    memoryUsage: endMemory,
                    memoryDelta,
                    statusCode: res.statusCode,
                    timestamp: new Date().toISOString()
                };

                // Log performance issues
                if (duration > 5000) {
                    logData.issue = 'slow_request';
                    this.logger.warn('Performance Issue - Slow Request', logData);
                } else if (memoryDelta.heapUsed > 50 * 1024 * 1024) { // 50MB
                    logData.issue = 'high_memory_usage';
                    this.logger.warn('Performance Issue - High Memory Usage', logData);
                } else {
                    this.logger.debug('Performance Metrics', logData);
                }
            });

            next();
        };
    }

    /**
     * Business logic event logging
     */
    businessLogger() {
        return {
            logBooking: (action, bookingData, userId, error = null) => {
                const logData = {
                    type: 'business_event',
                    category: 'booking',
                    action,
                    userId,
                    bookingId: bookingData.id,
                    eventId: bookingData.eventId,
                    amount: bookingData.totalAmount,
                    seatCount: bookingData.seatCount,
                    timestamp: new Date().toISOString()
                };

                if (error) {
                    logData.error = error.message;
                    logData.errorCode = error.code;
                    this.logger.error(`Booking ${action} Failed`, logData);
                } else {
                    this.logger.info(`Booking ${action} Success`, logData);
                }
            },

            logPayment: (action, paymentData, userId, error = null) => {
                const logData = {
                    type: 'business_event',
                    category: 'payment',
                    action,
                    userId,
                    paymentId: paymentData.id,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    method: paymentData.method,
                    timestamp: new Date().toISOString()
                };

                if (error) {
                    logData.error = error.message;
                    logData.errorCode = error.code;
                    this.logger.error(`Payment ${action} Failed`, logData);
                } else {
                    this.logger.info(`Payment ${action} Success`, logData);
                }
            },

            logEvent: (action, eventData, userId, error = null) => {
                const logData = {
                    type: 'business_event',
                    category: 'event',
                    action,
                    userId,
                    eventId: eventData.id,
                    eventName: eventData.name,
                    timestamp: new Date().toISOString()
                };

                if (error) {
                    logData.error = error.message;
                    this.logger.error(`Event ${action} Failed`, logData);
                } else {
                    this.logger.info(`Event ${action} Success`, logData);
                }
            }
        };
    }

    /**
     * Error logging with context
     */
    errorLogger() {
        return (error, req, res, next) => {
            const logData = {
                type: 'application_error',
                errorId: error.errorId || 'unknown',
                name: error.name,
                message: error.message,
                stack: error.stack,
                statusCode: error.statusCode || 500,
                requestId: req.requestId,
                method: req.method,
                url: req.originalUrl,
                userId: req.user?.id,
                ip: this.getClientIP(req),
                userAgent: req.headers['user-agent'],
                body: this.sanitizeData(req.body),
                query: this.sanitizeData(req.query),
                params: req.params,
                timestamp: new Date().toISOString()
            };

            if (error.statusCode >= 500) {
                this.logger.error('Application Error', logData);
            } else {
                this.logger.warn('Client Error', logData);
            }

            next(error);
        };
    }

    /**
     * Custom log methods
     */
    log(level, message, meta = {}) {
        this.logger.log(level, message, {
            ...meta,
            timestamp: new Date().toISOString()
        });
    }

    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    error(message, meta = {}) {
        this.log('error', message, meta);
    }

    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }

    /**
     * Get client IP address
     * @private
     */
    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
               req.headers['x-real-ip'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               req.ip;
    }

    /**
     * Get authentication action from path
     * @private
     */
    getAuthAction(path) {
        if (path.includes('login')) return 'login';
        if (path.includes('register')) return 'register';
        if (path.includes('logout')) return 'logout';
        if (path.includes('forgot')) return 'forgot_password';
        if (path.includes('reset')) return 'reset_password';
        if (path.includes('verify')) return 'verify_email';
        return 'auth_action';
    }

    /**
     * Sanitize sensitive data for logging
     * @private
     */
    sanitizeData(data) {
        if (!data || typeof data !== 'object') {
            return data;
        }

        const sensitiveFields = [
            'password',
            'confirmPassword',
            'token',
            'accessToken',
            'refreshToken',
            'creditCard',
            'ccNumber',
            'cvv',
            'ssn',
            'socialSecurityNumber'
        ];

        const sanitized = { ...data };

        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });

        return sanitized;
    }

    /**
     * Create child logger with additional context
     */
    createChildLogger(context = {}) {
        return this.logger.child(context);
    }

    /**
     * Get logger instance
     */
    getLogger() {
        return this.logger;
    }
}

// Create singleton instance
const loggingMiddleware = new LoggingMiddleware();

module.exports = {
    // Class for advanced usage
    LoggingMiddleware,

    // Middleware functions
    requestLogger: loggingMiddleware.requestLogger.bind(loggingMiddleware),
    authLogger: loggingMiddleware.authLogger.bind(loggingMiddleware),
    securityLogger: loggingMiddleware.securityLogger.bind(loggingMiddleware),
    performanceLogger: loggingMiddleware.performanceLogger.bind(loggingMiddleware),
    errorLogger: loggingMiddleware.errorLogger.bind(loggingMiddleware),
    
    // Utility functions
    databaseLogger: loggingMiddleware.databaseLogger.bind(loggingMiddleware),
    businessLogger: loggingMiddleware.businessLogger.bind(loggingMiddleware),
    log: loggingMiddleware.log.bind(loggingMiddleware),
    info: loggingMiddleware.info.bind(loggingMiddleware),
    warn: loggingMiddleware.warn.bind(loggingMiddleware),
    error: loggingMiddleware.error.bind(loggingMiddleware),
    debug: loggingMiddleware.debug.bind(loggingMiddleware),
    createChildLogger: loggingMiddleware.createChildLogger.bind(loggingMiddleware),
    getLogger: loggingMiddleware.getLogger.bind(loggingMiddleware),

    // Convenience middleware combinations
    logging: {
        // Basic logging for development
        basic: [
            loggingMiddleware.requestLogger(),
            loggingMiddleware.errorLogger()
        ],

        // Full logging for production
        production: [
            loggingMiddleware.requestLogger(),
            loggingMiddleware.authLogger(),
            loggingMiddleware.securityLogger(),
            loggingMiddleware.performanceLogger(),
            loggingMiddleware.errorLogger()
        ],

        // API-specific logging
        api: [
            loggingMiddleware.requestLogger(),
            loggingMiddleware.performanceLogger(),
            loggingMiddleware.errorLogger()
        ]
    }
};
