const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');

/**
 * EventMax Security Middleware
 * Comprehensive security configuration for production-ready application
 * Includes CORS, security headers, CSP, and various protection mechanisms
 */
class SecurityMiddleware {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
        this.isProduction = process.env.NODE_ENV === 'production';
    }

    /**
     * Configure CORS with flexible options
     * @param {Object} options - CORS configuration options
     */
    configureCORS(options = {}) {
        const defaultOptions = {
            origin: this.getAllowedOrigins(),
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'X-HTTP-Method-Override',
                'Accept',
                'Origin',
                'Access-Control-Request-Method',
                'Access-Control-Request-Headers',
                'X-CSRF-Token',
                'X-Request-ID'
            ],
            exposedHeaders: [
                'X-Total-Count',
                'X-RateLimit-Limit',
                'X-RateLimit-Remaining',
                'X-RateLimit-Reset',
                'X-Request-ID'
            ],
            maxAge: 86400, // 24 hours
            ...options
        };

        return cors(defaultOptions);
    }

    /**
     * Get allowed origins based on environment
     * @private
     */
    getAllowedOrigins() {
        if (this.isDevelopment) {
            return [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:5173',
                'http://localhost:8080',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:5173'
            ];
        }

        // Production origins from environment
        const origins = process.env.ALLOWED_ORIGINS;
        if (origins) {
            return origins.split(',').map(origin => origin.trim());
        }

        // Default production origins
        return [
            'https://eventmax.in',
            'https://www.eventmax.in',
            'https://app.eventmax.in'
        ];
    }

    /**
     * Configure Helmet security headers
     */
    configureHelmet() {
        return helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: [
                        "'self'",
                        "'unsafe-inline'",
                        'https://fonts.googleapis.com',
                        'https://cdnjs.cloudflare.com'
                    ],
                    fontSrc: [
                        "'self'",
                        'https://fonts.gstatic.com',
                        'data:'
                    ],
                    imgSrc: [
                        "'self'",
                        'data:',
                        'https:',
                        'blob:'
                    ],
                    scriptSrc: [
                        "'self'",
                        ...(this.isDevelopment ? ["'unsafe-eval'", "'unsafe-inline'"] : [])
                    ],
                    connectSrc: [
                        "'self'",
                        'wss:',
                        'https:',
                        ...(this.isDevelopment ? ['ws:', 'http:'] : [])
                    ],
                    frameSrc: ["'none'"],
                    objectSrc: ["'none'"],
                    upgradeInsecureRequests: this.isProduction ? [] : null,
                },
                reportOnly: this.isDevelopment
            },
            crossOriginEmbedderPolicy: false,
            crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
            crossOriginResourcePolicy: { policy: "cross-origin" },
            hsts: {
                maxAge: 31536000, // 1 year
                includeSubDomains: true,
                preload: true
            },
            noSniff: true,
            frameguard: { action: 'deny' },
            xssFilter: true,
            referrerPolicy: { policy: "strict-origin-when-cross-origin" }
        });
    }

    /**
     * Request ID middleware for tracing
     */
    requestId() {
        return (req, res, next) => {
            const requestId = req.headers['x-request-id'] || uuidv4();
            req.requestId = requestId;
            res.setHeader('X-Request-ID', requestId);
            next();
        };
    }

    /**
     * Security headers middleware
     */
    securityHeaders() {
        return (req, res, next) => {
            // Remove powered by header
            res.removeHeader('X-Powered-By');

            // Add custom security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

            // Add cache control for API responses
            if (req.path.startsWith('/api/')) {
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
            }

            next();
        };
    }

    /**
     * CSRF protection middleware
     */
    csrfProtection() {
        return (req, res, next) => {
            // Skip CSRF for GET, HEAD, OPTIONS requests
            if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
                return next();
            }

            // Skip CSRF for API endpoints using JWT
            if (req.path.startsWith('/api/') && req.headers.authorization) {
                return next();
            }

            const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
            const sessionCsrfToken = req.session?.csrfToken;

            if (!csrfToken || csrfToken !== sessionCsrfToken) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid CSRF token',
                    code: 'CSRF_TOKEN_INVALID'
                });
            }

            next();
        };
    }

    /**
     * IP whitelist middleware
     * @param {Array} allowedIPs - Array of allowed IP addresses or ranges
     */
    ipWhitelist(allowedIPs = []) {
        return (req, res, next) => {
            if (!allowedIPs.length) {
                return next();
            }

            const clientIP = this.getClientIP(req);
            
            if (!this.isIPAllowed(clientIP, allowedIPs)) {
                console.warn(`Blocked IP access: ${clientIP}`);
                return res.status(403).json({
                    success: false,
                    message: 'Access denied from this IP address',
                    code: 'IP_ACCESS_DENIED'
                });
            }

            next();
        };
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
     * Check if IP is allowed
     * @private
     */
    isIPAllowed(ip, allowedIPs) {
        return allowedIPs.some(allowedIP => {
            if (allowedIP.includes('/')) {
                // CIDR notation support
                return this.isIPInRange(ip, allowedIP);
            }
            return ip === allowedIP;
        });
    }

    /**
     * Check if IP is in CIDR range
     * @private
     */
    isIPInRange(ip, cidr) {
        // Simple CIDR check - in production use a proper library like 'ip-range-check'
        const [range, bits] = cidr.split('/');
        const mask = ~(2 ** (32 - bits) - 1);
        return (this.ip2int(ip) & mask) === (this.ip2int(range) & mask);
    }

    /**
     * Convert IP to integer
     * @private
     */
    ip2int(ip) {
        return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    }

    /**
     * Request sanitization middleware
     */
    sanitizeRequest() {
        return (req, res, next) => {
            // Sanitize query parameters
            if (req.query) {
                req.query = this.sanitizeObject(req.query);
            }

            // Sanitize request body
            if (req.body && typeof req.body === 'object') {
                req.body = this.sanitizeObject(req.body);
            }

            // Sanitize parameters
            if (req.params) {
                req.params = this.sanitizeObject(req.params);
            }

            next();
        };
    }

    /**
     * Sanitize object by removing potentially dangerous characters
     * @private
     */
    sanitizeObject(obj) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        const sanitized = {};
        
        for (const [key, value] of Object.entries(obj)) {
            const sanitizedKey = this.sanitizeString(key);
            
            if (typeof value === 'string') {
                sanitized[sanitizedKey] = this.sanitizeString(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[sanitizedKey] = this.sanitizeObject(value);
            } else {
                sanitized[sanitizedKey] = value;
            }
        }

        return sanitized;
    }

    /**
     * Sanitize string by removing dangerous patterns
     * @private
     */
    sanitizeString(str) {
        if (typeof str !== 'string') {
            return str;
        }

        return str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .replace(/eval\s*\(/gi, '') // Remove eval calls
            .trim();
    }

    /**
     * Content compression middleware
     */
    compressionMiddleware() {
        return compression({
            filter: (req, res) => {
                // Don't compress responses if this request asks not to
                if (req.headers['x-no-compression']) {
                    return false;
                }

                // Use compression filter
                return compression.filter(req, res);
            },
            level: this.isProduction ? 6 : 1, // Higher compression in production
            threshold: 1024 // Only compress if response is larger than 1KB
        });
    }

    /**
     * API key validation middleware
     * @param {string} headerName - Header name for API key
     */
    apiKeyValidation(headerName = 'X-API-Key') {
        return (req, res, next) => {
            const apiKey = req.headers[headerName.toLowerCase()];
            const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

            if (!validApiKeys.length) {
                return next(); // No API keys configured, skip validation
            }

            if (!apiKey) {
                return res.status(401).json({
                    success: false,
                    message: 'API key required',
                    code: 'API_KEY_REQUIRED'
                });
            }

            if (!validApiKeys.includes(apiKey)) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid API key',
                    code: 'INVALID_API_KEY'
                });
            }

            next();
        };
    }

    /**
     * Content validation middleware
     */
    contentValidation() {
        return (req, res, next) => {
            // Validate content length
            const contentLength = parseInt(req.headers['content-length'], 10);
            const maxSize = 10 * 1024 * 1024; // 10MB

            if (contentLength > maxSize) {
                return res.status(413).json({
                    success: false,
                    message: 'Request entity too large',
                    code: 'PAYLOAD_TOO_LARGE'
                });
            }

            // Validate content type for POST/PUT requests
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                const contentType = req.headers['content-type'];
                const allowedTypes = [
                    'application/json',
                    'application/x-www-form-urlencoded',
                    'multipart/form-data',
                    'text/plain'
                ];

                if (contentType && !allowedTypes.some(type => contentType.includes(type))) {
                    return res.status(415).json({
                        success: false,
                        message: 'Unsupported media type',
                        code: 'UNSUPPORTED_MEDIA_TYPE'
                    });
                }
            }

            next();
        };
    }

    /**
     * HTTP method validation
     * @param {Array} allowedMethods - Array of allowed HTTP methods
     */
    methodValidation(allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']) {
        return (req, res, next) => {
            if (!allowedMethods.includes(req.method)) {
                return res.status(405).json({
                    success: false,
                    message: 'Method not allowed',
                    code: 'METHOD_NOT_ALLOWED'
                });
            }

            next();
        };
    }

    /**
     * Security audit logging
     */
    securityAuditLog() {
        return (req, res, next) => {
            const securityEvents = [
                'login',
                'logout',
                'password-reset',
                'admin-action',
                'payment',
                'data-export'
            ];

            const shouldLog = securityEvents.some(event => 
                req.path.includes(event) || req.body?.action === event
            );

            if (shouldLog) {
                const auditLog = {
                    timestamp: new Date().toISOString(),
                    event: 'security_event',
                    requestId: req.requestId,
                    userId: req.user?.id,
                    ip: this.getClientIP(req),
                    userAgent: req.headers['user-agent'],
                    method: req.method,
                    path: req.path,
                    body: this.sanitizeAuditData(req.body)
                };

                console.log('Security audit:', auditLog);
                // In production, send to security monitoring system
            }

            next();
        };
    }

    /**
     * Sanitize data for audit logging
     * @private
     */
    sanitizeAuditData(data) {
        if (!data || typeof data !== 'object') {
            return data;
        }

        const sensitiveFields = ['password', 'token', 'creditCard', 'ssn'];
        const sanitized = { ...data };

        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });

        return sanitized;
    }
}

// Create singleton instance
const securityMiddleware = new SecurityMiddleware();

module.exports = {
    // Class for advanced usage
    SecurityMiddleware,

    // Main middleware functions
    cors: securityMiddleware.configureCORS.bind(securityMiddleware),
    helmet: securityMiddleware.configureHelmet.bind(securityMiddleware),
    requestId: securityMiddleware.requestId.bind(securityMiddleware),
    securityHeaders: securityMiddleware.securityHeaders.bind(securityMiddleware),
    csrfProtection: securityMiddleware.csrfProtection.bind(securityMiddleware),
    ipWhitelist: securityMiddleware.ipWhitelist.bind(securityMiddleware),
    sanitizeRequest: securityMiddleware.sanitizeRequest.bind(securityMiddleware),
    compression: securityMiddleware.compressionMiddleware.bind(securityMiddleware),
    apiKeyValidation: securityMiddleware.apiKeyValidation.bind(securityMiddleware),
    contentValidation: securityMiddleware.contentValidation.bind(securityMiddleware),
    methodValidation: securityMiddleware.methodValidation.bind(securityMiddleware),
    securityAuditLog: securityMiddleware.securityAuditLog.bind(securityMiddleware),

    // Convenience middleware combinations
    security: {
        // Basic security for development
        basic: [
            securityMiddleware.requestId(),
            securityMiddleware.configureCORS(),
            securityMiddleware.securityHeaders(),
            securityMiddleware.sanitizeRequest(),
            securityMiddleware.contentValidation()
        ],

        // Full security for production
        production: [
            securityMiddleware.requestId(),
            securityMiddleware.configureCORS(),
            securityMiddleware.configureHelmet(),
            securityMiddleware.securityHeaders(),
            securityMiddleware.compressionMiddleware(),
            securityMiddleware.sanitizeRequest(),
            securityMiddleware.contentValidation(),
            securityMiddleware.securityAuditLog()
        ],

        // API security
        api: [
            securityMiddleware.requestId(),
            securityMiddleware.configureCORS({
                origin: true,
                credentials: true
            }),
            securityMiddleware.securityHeaders(),
            securityMiddleware.sanitizeRequest(),
            securityMiddleware.contentValidation()
        ]
    }
};
