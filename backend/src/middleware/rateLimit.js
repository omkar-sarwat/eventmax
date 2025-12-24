const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const redis = require('../config/redis');

/**
 * EventMax Rate Limiting Middleware
 * Comprehensive rate limiting with Redis storage and flexible configurations
 * Protects against abuse and ensures fair usage
 */
class RateLimitMiddleware {
    constructor() {
        this.redis = redis.getRedis();
        
        // Initialize all rate limiters at construction time
        this.rateLimiters = {
            general: this.createRateLimit({
                windowMs: 60 * 60 * 1000, // 1 hour
                max: 1000,
                message: {
                    success: false,
                    message: 'Too many requests. Please try again later.',
                    code: 'RATE_LIMIT_EXCEEDED'
                }
            }),
            
            search: this.createRateLimit({
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 500,
                message: {
                    success: false,
                    message: 'Too many search requests. Please slow down.',
                    code: 'SEARCH_RATE_LIMIT_EXCEEDED'
                }
            }),
            
            auth: this.createRateLimit({
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 10,
                message: {
                    success: false,
                    message: 'Too many authentication attempts. Please try again later.',
                    code: 'AUTH_RATE_LIMIT_EXCEEDED'
                }
            }),
            
            booking: this.createRateLimit({
                windowMs: 5 * 60 * 1000, // 5 minutes
                max: 20,
                message: {
                    success: false,
                    message: 'Too many booking attempts. Please slow down.',
                    code: 'BOOKING_RATE_LIMIT_EXCEEDED'
                }
            }),
            
            upload: this.createRateLimit({
                windowMs: 60 * 60 * 1000, // 1 hour
                max: 50,
                message: {
                    success: false,
                    message: 'Too many upload requests. Please try again later.',
                    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
                }
            })
        };
    }

    /**
     * Create a Redis store for rate limiting
     */
    createRedisStore() {
        // Use memory store for now, Redis store can be added later
        return undefined; // This will make express-rate-limit use memory store
    }

    /**
     * Standard rate limit configuration
     * @param {Object} options - Rate limit options
     */
    createRateLimit(options = {}) {
        const defaultOptions = {
            // store: this.createRedisStore(), // Use memory store for now
            standardHeaders: true,
            legacyHeaders: false,
            message: {
                success: false,
                message: 'Too many requests. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED'
            },
            ...options
        };

        return rateLimit(defaultOptions);
    }

    /**
     * General API rate limiting
     * 1000 requests per hour per IP
     */
    general() {
        return this.rateLimiters.general;
    }

    /**
     * Authentication endpoint rate limiting
     * Stricter limits for login/register endpoints
     */
    auth() {
        return this.rateLimiters.auth;
    }

    /**
     * Login specific rate limiting
     * Even stricter for login attempts
     */
    login() {
        return this.createRateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // 5 login attempts per 15 minutes
            message: {
                success: false,
                message: 'Too many login attempts. Please try again in 15 minutes.',
                code: 'LOGIN_RATE_LIMIT_EXCEEDED'
            },
            keyGenerator: (req) => {
                const email = req.body?.email || req.body?.username;
                return email ? `login:email:${email}` : `login:ip:${ipKeyGenerator(req)}`;
            },
            skipSuccessfulRequests: true
        });
    }

    /**
     * Registration rate limiting
     * Prevent spam registrations
     */
    register() {
        return this.createRateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 3, // 3 registrations per hour per IP
            message: {
                success: false,
                message: 'Too many registration attempts. Please try again in an hour.',
                code: 'REGISTER_RATE_LIMIT_EXCEEDED'
            },
            keyGenerator: (req) => `register:ip:${ipKeyGenerator(req)}`
        });
    }

    /**
     * Password reset rate limiting
     * Prevent abuse of password reset functionality
     */
    passwordReset() {
        return this.createRateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 3, // 3 password resets per hour
            message: {
                success: false,
                message: 'Too many password reset requests. Please try again in an hour.',
                code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
            },
            keyGenerator: (req) => {
                const email = req.body?.email;
                return email ? `reset:email:${email}` : `reset:ip:${ipKeyGenerator(req)}`;
            }
        });
    }

    /**
     * Email verification rate limiting
     * Prevent spam of verification emails
     */
    emailVerification() {
        return this.createRateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 5, // 5 verification emails per hour
            message: {
                success: false,
                message: 'Too many verification email requests. Please try again in an hour.',
                code: 'EMAIL_VERIFICATION_RATE_LIMIT_EXCEEDED'
            },
            keyGenerator: (req) => {
                return req.user ? `verify:user:${req.user.id}` : `verify:ip:${ipKeyGenerator(req)}`;
            }
        });
    }

    /**
     * Booking rate limiting
     * Prevent rapid booking attempts that could cause issues
     */
    booking() {
        return this.rateLimiters.booking;
    }

    /**
     * Seat reservation rate limiting
     * Critical for preventing seat reservation abuse
     */
    seatReservation() {
        return this.createRateLimit({
            windowMs: 60 * 1000, // 1 minute
            max: 20, // 20 seat operations per minute
            message: {
                success: false,
                message: 'Too many seat reservation attempts. Please slow down.',
                code: 'SEAT_RESERVATION_RATE_LIMIT_EXCEEDED'
            },
            keyGenerator: (req) => {
                return req.user ? `seats:user:${req.user.id}` : `seats:ip:${ipKeyGenerator(req)}`;
            }
        });
    }

    /**
     * Payment processing rate limiting
     * Strict limits for payment-related operations
     */
    payment() {
        return this.createRateLimit({
            windowMs: 10 * 60 * 1000, // 10 minutes
            max: 5, // 5 payment attempts per 10 minutes
            message: {
                success: false,
                message: 'Too many payment attempts. Please try again in 10 minutes.',
                code: 'PAYMENT_RATE_LIMIT_EXCEEDED'
            },
            keyGenerator: (req) => {
                return req.user ? `payment:user:${req.user.id}` : `payment:ip:${ipKeyGenerator(req)}`;
            }
        });
    }

    /**
     * Search rate limiting
     * Prevent search spam
     */
    search() {
        return this.rateLimiters.search;
    }

    /**
     * File upload rate limiting
     * Prevent upload abuse
     */
    upload() {
        return this.createRateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 50, // 50 uploads per hour
            message: {
                success: false,
                message: 'Too many file uploads. Please try again in an hour.',
                code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
            },
            keyGenerator: (req) => {
                return req.user ? `upload:user:${req.user.id}` : `upload:ip:${ipKeyGenerator(req)}`;
            }
        });
    }

    /**
     * Admin operations rate limiting
     * High limits for admin users
     */
    admin() {
        return this.createRateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 10000, // 10k requests per hour for admins
            message: {
                success: false,
                message: 'Admin rate limit exceeded. Please contact system administrator.',
                code: 'ADMIN_RATE_LIMIT_EXCEEDED'
            },
            keyGenerator: (req) => {
                return req.user ? `admin:user:${req.user.id}` : `admin:ip:${ipKeyGenerator(req)}`;
            },
            skip: (req) => {
                // Skip rate limiting for admin users
                return req.user && req.user.role === 'admin';
            }
        });
    }

    /**
     * Custom rate limiter with specific configuration
     * @param {Object} config - Custom configuration
     */
    custom(config) {
        return this.createRateLimit(config);
    }

    /**
     * Advanced rate limiting with multiple tiers
     * @param {Array} tiers - Array of tier configurations
     */
    tiered(tiers) {
        return async (req, res, next) => {
            try {
                const userKey = req.user ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req)}`;
                
                for (const tier of tiers) {
                    const key = `${tier.name}:${userKey}`;
                    const current = await this.redis.get(key);
                    const count = parseInt(current) || 0;

                    if (count >= tier.max) {
                        return res.status(429).json({
                            success: false,
                            message: tier.message || 'Rate limit exceeded',
                            code: 'TIERED_RATE_LIMIT_EXCEEDED',
                            tier: tier.name
                        });
                    }

                    // Increment counter
                    await this.redis.multi()
                        .incr(key)
                        .expire(key, tier.windowMs / 1000)
                        .exec();
                }

                next();

            } catch (error) {
                console.error('Tiered rate limit error:', error);
                next(error);
            }
        };
    }

    /**
     * Sliding window rate limiter
     * More accurate than fixed window
     */
    slidingWindow(options = {}) {
        const { windowMs = 60000, max = 100, keyGenerator } = options;

        return async (req, res, next) => {
            try {
                const key = keyGenerator ? keyGenerator(req) : 
                    (req.user ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req)}`);
                
                const now = Date.now();
                const windowStart = now - windowMs;
                
                const redisKey = `sliding:${key}`;
                
                // Remove old entries and count current requests
                const pipeline = this.redis.pipeline();
                pipeline.zremrangebyscore(redisKey, 0, windowStart);
                pipeline.zcard(redisKey);
                pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
                pipeline.expire(redisKey, Math.ceil(windowMs / 1000));
                
                const results = await pipeline.exec();
                const currentCount = parseInt(results[1][1]) || 0;

                if (currentCount >= max) {
                    return res.status(429).json({
                        success: false,
                        message: 'Rate limit exceeded',
                        code: 'SLIDING_WINDOW_RATE_LIMIT_EXCEEDED'
                    });
                }

                next();

            } catch (error) {
                console.error('Sliding window rate limit error:', error);
                next(error);
            }
        };
    }

    /**
     * Burst rate limiter
     * Allows short bursts but limits sustained usage
     */
    burst(options = {}) {
        const { 
            burstMax = 10, 
            burstWindowMs = 10000, 
            sustainedMax = 100, 
            sustainedWindowMs = 60000,
            keyGenerator 
        } = options;

        return async (req, res, next) => {
            try {
                const key = keyGenerator ? keyGenerator(req) : 
                    (req.user ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req)}`);

                const burstKey = `burst:${key}`;
                const sustainedKey = `sustained:${key}`;

                // Check burst limit
                const burstCount = await this.redis.get(burstKey);
                if (parseInt(burstCount) >= burstMax) {
                    return res.status(429).json({
                        success: false,
                        message: 'Burst rate limit exceeded. Please slow down.',
                        code: 'BURST_RATE_LIMIT_EXCEEDED'
                    });
                }

                // Check sustained limit
                const sustainedCount = await this.redis.get(sustainedKey);
                if (parseInt(sustainedCount) >= sustainedMax) {
                    return res.status(429).json({
                        success: false,
                        message: 'Sustained rate limit exceeded.',
                        code: 'SUSTAINED_RATE_LIMIT_EXCEEDED'
                    });
                }

                // Increment counters
                const pipeline = this.redis.pipeline();
                pipeline.incr(burstKey);
                pipeline.expire(burstKey, Math.ceil(burstWindowMs / 1000));
                pipeline.incr(sustainedKey);
                pipeline.expire(sustainedKey, Math.ceil(sustainedWindowMs / 1000));
                await pipeline.exec();

                next();

            } catch (error) {
                console.error('Burst rate limit error:', error);
                next(error);
            }
        };
    }

    /**
     * Distributed rate limiter using Redis Lua script
     * Most accurate for distributed systems
     */
    distributed(options = {}) {
        const { 
            windowMs = 60000, 
            max = 100, 
            keyGenerator,
            identifier = 'default'
        } = options;

        // Lua script for atomic rate limiting
        const luaScript = `
            local key = KEYS[1]
            local window = tonumber(ARGV[1])
            local limit = tonumber(ARGV[2])
            local now = tonumber(ARGV[3])
            local identifier = ARGV[4]
            
            local current = redis.call('GET', key)
            local count = tonumber(current) or 0
            
            if count >= limit then
                return {count, limit, window}
            end
            
            local ttl = redis.call('TTL', key)
            if ttl == -1 then
                redis.call('SET', key, 1)
                redis.call('EXPIRE', key, window)
                return {1, limit, window}
            else
                local newCount = redis.call('INCR', key)
                return {newCount, limit, window}
            end
        `;

        return async (req, res, next) => {
            try {
                const key = keyGenerator ? keyGenerator(req) : 
                    (req.user ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req)}`);
                
                const redisKey = `distributed:${identifier}:${key}`;
                const now = Date.now();
                
                const result = await this.redis.eval(
                    luaScript, 
                    1, 
                    redisKey, 
                    Math.ceil(windowMs / 1000), 
                    max, 
                    now,
                    identifier
                );

                const [count, limit, window] = result;

                if (count > limit) {
                    return res.status(429).json({
                        success: false,
                        message: 'Distributed rate limit exceeded',
                        code: 'DISTRIBUTED_RATE_LIMIT_EXCEEDED',
                        count,
                        limit,
                        window
                    });
                }

                // Add rate limit headers
                res.set({
                    'X-RateLimit-Limit': limit,
                    'X-RateLimit-Remaining': Math.max(0, limit - count),
                    'X-RateLimit-Reset': new Date(now + window * 1000).toISOString()
                });

                next();

            } catch (error) {
                console.error('Distributed rate limit error:', error);
                next(error);
            }
        };
    }
}

// Create singleton instance
const rateLimitMiddleware = new RateLimitMiddleware();

module.exports = {
    // Class for advanced usage
    RateLimitMiddleware,

    // Standard rate limiters
    general: rateLimitMiddleware.general.bind(rateLimitMiddleware),
    auth: rateLimitMiddleware.auth.bind(rateLimitMiddleware),
    login: rateLimitMiddleware.login.bind(rateLimitMiddleware),
    register: rateLimitMiddleware.register.bind(rateLimitMiddleware),
    passwordReset: rateLimitMiddleware.passwordReset.bind(rateLimitMiddleware),
    emailVerification: rateLimitMiddleware.emailVerification.bind(rateLimitMiddleware),
    booking: rateLimitMiddleware.booking.bind(rateLimitMiddleware),
    seatReservation: rateLimitMiddleware.seatReservation.bind(rateLimitMiddleware),
    payment: rateLimitMiddleware.payment.bind(rateLimitMiddleware),
    search: rateLimitMiddleware.search.bind(rateLimitMiddleware),
    upload: rateLimitMiddleware.upload.bind(rateLimitMiddleware),
    admin: rateLimitMiddleware.admin.bind(rateLimitMiddleware),

    // Advanced rate limiters
    custom: rateLimitMiddleware.custom.bind(rateLimitMiddleware),
    tiered: rateLimitMiddleware.tiered.bind(rateLimitMiddleware),
    slidingWindow: rateLimitMiddleware.slidingWindow.bind(rateLimitMiddleware),
    burst: rateLimitMiddleware.burst.bind(rateLimitMiddleware),
    distributed: rateLimitMiddleware.distributed.bind(rateLimitMiddleware),

    // Convenience combinations
    rateLimit: {
        // API endpoints
        api: rateLimitMiddleware.general(),
        
        // Authentication endpoints
        authLogin: [
            rateLimitMiddleware.auth(),
            rateLimitMiddleware.login()
        ],
        
        authRegister: [
            rateLimitMiddleware.auth(),
            rateLimitMiddleware.register()
        ],
        
        // Critical operations
        critical: rateLimitMiddleware.burst({
            burstMax: 5,
            burstWindowMs: 10000,
            sustainedMax: 20,
            sustainedWindowMs: 60000
        }),
        
        // High frequency operations
        realtime: rateLimitMiddleware.slidingWindow({
            windowMs: 60000,
            max: 200
        })
    }
};
