const { v4: uuidv4 } = require('uuid');

/**
 * EventMax Error Handling Middleware
 * Comprehensive error handling with logging, monitoring, and user-friendly responses
 * Handles all types of errors with proper status codes and security considerations
 */
class ErrorHandlingMiddleware {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
        this.isProduction = process.env.NODE_ENV === 'production';
    }

    /**
     * Global error handler middleware
     * Should be the last middleware in the chain
     */
    globalErrorHandler() {
        return (error, req, res, next) => {
            // Generate unique error ID for tracking
            const errorId = uuidv4();
            
            // Log error with context
            this.logError(error, req, errorId);

            // Determine error type and response
            const errorResponse = this.buildErrorResponse(error, errorId);

            // Send response
            res.status(errorResponse.statusCode).json(errorResponse.body);
        };
    }

    /**
     * Async error catcher for route handlers
     * Wraps async functions to catch and forward errors
     */
    asyncErrorCatcher(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next))
                .catch(next);
        };
    }

    /**
     * 404 Not Found handler
     */
    notFoundHandler() {
        return (req, res) => {
            const errorResponse = {
                success: false,
                message: `Route ${req.method} ${req.originalUrl} not found`,
                code: 'ROUTE_NOT_FOUND',
                statusCode: 404,
                timestamp: new Date().toISOString(),
                path: req.originalUrl,
                method: req.method
            };

            // Log 404 for monitoring
            console.warn('404 Not Found:', {
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            res.status(404).json(errorResponse);
        };
    }

    /**
     * Build error response based on error type
     * @private
     */
    buildErrorResponse(error, errorId) {
        const baseResponse = {
            success: false,
            errorId,
            timestamp: new Date().toISOString()
        };

        // Handle specific error types
        if (error.name === 'ValidationError') {
            return {
                statusCode: 400,
                body: {
                    ...baseResponse,
                    message: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: this.formatValidationErrors(error)
                }
            };
        }

        if (error.name === 'CastError') {
            return {
                statusCode: 400,
                body: {
                    ...baseResponse,
                    message: 'Invalid data format',
                    code: 'CAST_ERROR',
                    field: error.path
                }
            };
        }

        if (error.code === 11000) { // MongoDB duplicate key
            return {
                statusCode: 409,
                body: {
                    ...baseResponse,
                    message: 'Resource already exists',
                    code: 'DUPLICATE_RESOURCE'
                }
            };
        }

        if (error.name === 'JsonWebTokenError') {
            return {
                statusCode: 401,
                body: {
                    ...baseResponse,
                    message: 'Invalid authentication token',
                    code: 'INVALID_TOKEN'
                }
            };
        }

        if (error.name === 'TokenExpiredError') {
            return {
                statusCode: 401,
                body: {
                    ...baseResponse,
                    message: 'Authentication token has expired',
                    code: 'TOKEN_EXPIRED'
                }
            };
        }

        if (error.name === 'MulterError') {
            return this.handleMulterError(error, baseResponse);
        }

        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return {
                statusCode: 503,
                body: {
                    ...baseResponse,
                    message: 'Service temporarily unavailable',
                    code: 'SERVICE_UNAVAILABLE'
                }
            };
        }

        // Handle custom application errors
        if (error.statusCode || error.status) {
            return {
                statusCode: error.statusCode || error.status,
                body: {
                    ...baseResponse,
                    message: error.message || 'An error occurred',
                    code: error.code || 'APPLICATION_ERROR',
                    ...(error.details && { details: error.details })
                }
            };
        }

        // Handle database errors
        if (error.code && typeof error.code === 'string') {
            return this.handleDatabaseError(error, baseResponse);
        }

        // Default internal server error
        return {
            statusCode: 500,
            body: {
                ...baseResponse,
                message: this.isDevelopment ? error.message : 'Internal server error',
                code: 'INTERNAL_SERVER_ERROR',
                ...(this.isDevelopment && { 
                    stack: error.stack,
                    details: error 
                })
            }
        };
    }

    /**
     * Handle Multer (file upload) errors
     * @private
     */
    handleMulterError(error, baseResponse) {
        const errorMap = {
            'LIMIT_FILE_SIZE': {
                message: 'File size too large',
                code: 'FILE_TOO_LARGE'
            },
            'LIMIT_FILE_COUNT': {
                message: 'Too many files',
                code: 'TOO_MANY_FILES'
            },
            'LIMIT_UNEXPECTED_FILE': {
                message: 'Unexpected file field',
                code: 'UNEXPECTED_FILE'
            },
            'LIMIT_PART_COUNT': {
                message: 'Too many parts',
                code: 'TOO_MANY_PARTS'
            }
        };

        const errorInfo = errorMap[error.code] || {
            message: 'File upload error',
            code: 'UPLOAD_ERROR'
        };

        return {
            statusCode: 400,
            body: {
                ...baseResponse,
                ...errorInfo
            }
        };
    }

    /**
     * Handle database-specific errors
     * @private
     */
    handleDatabaseError(error, baseResponse) {
        // PostgreSQL error codes
        const pgErrorMap = {
            '23505': { // unique_violation
                statusCode: 409,
                message: 'Resource already exists',
                code: 'DUPLICATE_RESOURCE'
            },
            '23503': { // foreign_key_violation
                statusCode: 400,
                message: 'Invalid reference',
                code: 'FOREIGN_KEY_VIOLATION'
            },
            '23502': { // not_null_violation
                statusCode: 400,
                message: 'Required field missing',
                code: 'REQUIRED_FIELD_MISSING'
            },
            '23514': { // check_violation
                statusCode: 400,
                message: 'Invalid data value',
                code: 'CHECK_VIOLATION'
            },
            '42703': { // undefined_column
                statusCode: 400,
                message: 'Invalid field',
                code: 'UNDEFINED_COLUMN'
            }
        };

        const errorInfo = pgErrorMap[error.code] || {
            statusCode: 500,
            message: 'Database error',
            code: 'DATABASE_ERROR'
        };

        return {
            statusCode: errorInfo.statusCode,
            body: {
                ...baseResponse,
                message: errorInfo.message,
                code: errorInfo.code
            }
        };
    }

    /**
     * Format validation errors
     * @private
     */
    formatValidationErrors(error) {
        if (error.details) {
            // Joi validation errors
            return error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
            }));
        }

        if (error.errors) {
            // Mongoose validation errors
            return Object.keys(error.errors).map(field => ({
                field,
                message: error.errors[field].message,
                value: error.errors[field].value
            }));
        }

        return [];
    }

    /**
     * Log error with context
     * @private
     */
    logError(error, req, errorId) {
        const errorLog = {
            errorId,
            timestamp: new Date().toISOString(),
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code
            },
            request: {
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                userId: req.user?.id,
                body: this.sanitizeRequestBody(req.body),
                query: req.query,
                params: req.params
            },
            environment: process.env.NODE_ENV
        };

        // Log to console in development
        if (this.isDevelopment) {
            console.error('Error occurred:', errorLog);
        }

        // In production, you might want to send to logging service
        if (this.isProduction) {
            // Send to external logging service (e.g., Sentry, LogRocket, etc.)
            this.sendToLoggingService(errorLog);
        }
    }

    /**
     * Sanitize request body for logging (remove sensitive data)
     * @private
     */
    sanitizeRequestBody(body) {
        if (!body || typeof body !== 'object') {
            return body;
        }

        const sensitiveFields = [
            'password',
            'confirmPassword',
            'token',
            'accessToken',
            'refreshToken',
            'creditCard',
            'ssn',
            'socialSecurityNumber'
        ];

        const sanitized = { ...body };

        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });

        return sanitized;
    }

    /**
     * Send error to external logging service
     * @private
     */
    sendToLoggingService(errorLog) {
        // Implement integration with logging service
        // Example: Sentry, LogRocket, DataDog, etc.
        try {
            // Sentry.captureException(errorLog);
            console.error('Production error:', errorLog);
        } catch (loggingError) {
            console.error('Failed to send error to logging service:', loggingError);
        }
    }

    /**
     * Create custom error class
     */
    createError(message, statusCode = 500, code = 'APPLICATION_ERROR', details = null) {
        const error = new Error(message);
        error.statusCode = statusCode;
        error.code = code;
        if (details) {
            error.details = details;
        }
        return error;
    }

    /**
     * Validation error helper
     */
    validationError(message, details = null) {
        return this.createError(message, 400, 'VALIDATION_ERROR', details);
    }

    /**
     * Authentication error helper
     */
    authError(message = 'Authentication required') {
        return this.createError(message, 401, 'AUTHENTICATION_ERROR');
    }

    /**
     * Authorization error helper
     */
    authorizationError(message = 'Insufficient permissions') {
        return this.createError(message, 403, 'AUTHORIZATION_ERROR');
    }

    /**
     * Not found error helper
     */
    notFoundError(message = 'Resource not found') {
        return this.createError(message, 404, 'NOT_FOUND');
    }

    /**
     * Conflict error helper
     */
    conflictError(message = 'Resource conflict') {
        return this.createError(message, 409, 'CONFLICT');
    }

    /**
     * Rate limit error helper
     */
    rateLimitError(message = 'Rate limit exceeded') {
        return this.createError(message, 429, 'RATE_LIMIT_EXCEEDED');
    }

    /**
     * Service unavailable error helper
     */
    serviceUnavailableError(message = 'Service temporarily unavailable') {
        return this.createError(message, 503, 'SERVICE_UNAVAILABLE');
    }

    /**
     * Request timeout middleware
     */
    requestTimeout(timeout = 30000) {
        return (req, res, next) => {
            const timer = setTimeout(() => {
                const error = this.createError(
                    'Request timeout',
                    408,
                    'REQUEST_TIMEOUT'
                );
                next(error);
            }, timeout);

            // Clear timeout if response is sent
            res.on('finish', () => {
                clearTimeout(timer);
            });

            next();
        };
    }

    /**
     * Error recovery middleware
     * Attempts to provide alternative responses for certain errors
     */
    errorRecovery() {
        return (error, req, res, next) => {
            // Attempt recovery for specific error types
            if (error.code === 'ECONNREFUSED' && req.path.includes('/api/')) {
                // Database connection failed - return cached response if available
                return this.returnCachedResponse(req, res, next);
            }

            if (error.name === 'TimeoutError') {
                // Request timeout - suggest retry
                return res.status(408).json({
                    success: false,
                    message: 'Request timeout. Please try again.',
                    code: 'REQUEST_TIMEOUT',
                    retry: true,
                    retryAfter: 5000
                });
            }

            // No recovery possible, pass to global error handler
            next(error);
        };
    }

    /**
     * Return cached response if available
     * @private
     */
    async returnCachedResponse(req, res, next) {
        try {
            // Implement cache lookup logic here
            // This is a placeholder for cache integration
            const cachedResponse = null; // await cache.get(req.originalUrl);

            if (cachedResponse) {
                return res.status(200).json({
                    ...cachedResponse,
                    cached: true,
                    message: 'Service temporarily unavailable. Returning cached data.'
                });
            }

            // No cached response available
            const error = this.serviceUnavailableError(
                'Service temporarily unavailable and no cached data available'
            );
            next(error);

        } catch (cacheError) {
            console.error('Cache lookup failed:', cacheError);
            next(this.serviceUnavailableError());
        }
    }

    /**
     * Health check for error handling system
     */
    healthCheck() {
        return (req, res) => {
            res.status(200).json({
                success: true,
                message: 'Error handling system is operational',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV
            });
        };
    }
}

// Create singleton instance
const errorHandling = new ErrorHandlingMiddleware();

module.exports = {
    // Class for advanced usage
    ErrorHandlingMiddleware,

    // Main middleware functions
    globalErrorHandler: errorHandling.globalErrorHandler.bind(errorHandling),
    asyncErrorCatcher: errorHandling.asyncErrorCatcher.bind(errorHandling),
    notFoundHandler: errorHandling.notFoundHandler.bind(errorHandling),
    errorRecovery: errorHandling.errorRecovery.bind(errorHandling),
    requestTimeout: errorHandling.requestTimeout.bind(errorHandling),

    // Error creation helpers
    createError: errorHandling.createError.bind(errorHandling),
    validationError: errorHandling.validationError.bind(errorHandling),
    authError: errorHandling.authError.bind(errorHandling),
    authorizationError: errorHandling.authorizationError.bind(errorHandling),
    notFoundError: errorHandling.notFoundError.bind(errorHandling),
    conflictError: errorHandling.conflictError.bind(errorHandling),
    rateLimitError: errorHandling.rateLimitError.bind(errorHandling),
    serviceUnavailableError: errorHandling.serviceUnavailableError.bind(errorHandling),

    // Utility functions
    healthCheck: errorHandling.healthCheck.bind(errorHandling),

    // Convenience middleware combinations
    errorHandling: {
        // Basic error handling chain
        basic: [
            errorHandling.requestTimeout(30000),
            errorHandling.errorRecovery(),
            errorHandling.globalErrorHandler()
        ],

        // Production error handling
        production: [
            errorHandling.requestTimeout(30000),
            errorHandling.errorRecovery(),
            errorHandling.globalErrorHandler()
        ],

        // Development error handling (more verbose)
        development: [
            errorHandling.requestTimeout(60000),
            errorHandling.globalErrorHandler()
        ]
    }
};
