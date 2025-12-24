const AuthService = require('../services/authService');

/**
 * EventMax Authentication Middleware
 * Comprehensive JWT token validation and user authentication
 * Handles token verification, user authorization, and security checks
 */
class AuthMiddleware {
    constructor() {
        this.authService = new AuthService();
    }

    /**
     * Verify JWT token and authenticate user
     * @param {boolean} optional - Whether authentication is optional
     */
    authenticateToken(optional = false) {
        return async (req, res, next) => {
            try {
                // Extract token from Authorization header
                const authHeader = req.headers.authorization;
                const token = authHeader && authHeader.startsWith('Bearer ') 
                    ? authHeader.slice(7) 
                    : null;

                // If no token and authentication is optional, continue
                if (!token && optional) {
                    req.user = null;
                    return next();
                }

                // If no token and authentication is required, return unauthorized
                if (!token) {
                    return res.status(401).json({
                        success: false,
                        message: 'Access token is required',
                        code: 'TOKEN_MISSING'
                    });
                }

                // Validate token
                const validation = await this.authService.validateAccessToken(token);

                if (!validation.valid) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid or expired token',
                        code: 'TOKEN_INVALID'
                    });
                }

                // Add user to request object
                req.user = validation.user;
                req.tokenData = validation.tokenData;

                next();

            } catch (error) {
                console.error('Authentication error:', error);

                // Handle specific token errors
                if (error.message.includes('expired')) {
                    return res.status(401).json({
                        success: false,
                        message: 'Token has expired',
                        code: 'TOKEN_EXPIRED'
                    });
                }

                if (error.message.includes('invalid') || error.message.includes('malformed')) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid token format',
                        code: 'TOKEN_MALFORMED'
                    });
                }

                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed',
                    code: 'AUTH_FAILED'
                });
            }
        };
    }

    /**
     * Require authentication (shorthand for authenticateToken(false))
     */
    requireAuth() {
        return this.authenticateToken(false);
    }

    /**
     * Optional authentication (shorthand for authenticateToken(true))
     */
    optionalAuth() {
        return this.authenticateToken(true);
    }

    /**
     * Require specific user role(s)
     * @param {string|Array} roles - Required role(s)
     * @param {boolean} allowOwnership - Allow access if user owns the resource
     */
    requireRole(roles, allowOwnership = false) {
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        return (req, res, next) => {
            try {
                // Check if user is authenticated
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    });
                }

                // Check role
                if (allowedRoles.includes(req.user.role)) {
                    return next();
                }

                // Check ownership if allowed
                if (allowOwnership && this.checkOwnership(req)) {
                    return next();
                }

                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    required_roles: allowedRoles
                });

            } catch (error) {
                console.error('Role check error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Authorization check failed',
                    code: 'AUTH_CHECK_FAILED'
                });
            }
        };
    }

    /**
     * Require admin role
     */
    requireAdmin() {
        return this.requireRole(['admin']);
    }

    /**
     * Require organizer or admin role
     */
    requireOrganizer() {
        return this.requireRole(['admin', 'organizer']);
    }

    /**
     * Require user to be active
     */
    requireActiveUser() {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    });
                }

                if (!req.user.is_active) {
                    return res.status(403).json({
                        success: false,
                        message: 'Account is deactivated. Please contact support.',
                        code: 'ACCOUNT_DEACTIVATED'
                    });
                }

                next();

            } catch (error) {
                console.error('Active user check error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'User status check failed',
                    code: 'USER_STATUS_CHECK_FAILED'
                });
            }
        };
    }

    /**
     * Require email verification
     */
    requireEmailVerification() {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    });
                }

                if (!req.user.is_email_verified) {
                    return res.status(403).json({
                        success: false,
                        message: 'Email verification required',
                        code: 'EMAIL_VERIFICATION_REQUIRED'
                    });
                }

                next();

            } catch (error) {
                console.error('Email verification check error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Email verification check failed',
                    code: 'EMAIL_CHECK_FAILED'
                });
            }
        };
    }

    /**
     * Check resource permissions
     * @param {string} resource - Resource type (user, event, booking, etc.)
     * @param {string} action - Action type (read, write, delete, etc.)
     * @param {Function} [contextExtractor] - Function to extract resource context
     */
    requirePermission(resource, action, contextExtractor = null) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    });
                }

                // Extract context for permission check
                let context = {};
                if (contextExtractor) {
                    context = contextExtractor(req);
                }

                // Check permission using auth service
                const hasPermission = await this.authService.checkPermission(
                    req.user.id,
                    resource,
                    action,
                    context
                );

                if (!hasPermission) {
                    return res.status(403).json({
                        success: false,
                        message: `Insufficient permissions for ${action} on ${resource}`,
                        code: 'INSUFFICIENT_PERMISSIONS'
                    });
                }

                next();

            } catch (error) {
                console.error('Permission check error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Permission check failed',
                    code: 'PERMISSION_CHECK_FAILED'
                });
            }
        };
    }

    /**
     * Check if user owns the resource
     * @private
     */
    checkOwnership(req) {
        // Check common ownership patterns
        const userId = req.user.id;

        // Check URL parameters
        if (req.params.userId === userId) return true;
        if (req.params.ownerId === userId) return true;

        // Check request body
        if (req.body.userId === userId) return true;
        if (req.body.ownerId === userId) return true;

        // Check query parameters
        if (req.query.userId === userId) return true;
        if (req.query.ownerId === userId) return true;

        return false;
    }

    /**
     * Middleware to check if user can access their own resources
     */
    requireOwnership() {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    });
                }

                // Admin can access any resource
                if (req.user.role === 'admin') {
                    return next();
                }

                // Check ownership
                if (!this.checkOwnership(req)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied - insufficient permissions',
                        code: 'ACCESS_DENIED'
                    });
                }

                next();

            } catch (error) {
                console.error('Ownership check error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Ownership check failed',
                    code: 'OWNERSHIP_CHECK_FAILED'
                });
            }
        };
    }

    /**
     * Middleware to add user context to request
     */
    addUserContext() {
        return (req, res, next) => {
            if (req.user) {
                req.userContext = {
                    id: req.user.id,
                    role: req.user.role,
                    email: req.user.email,
                    isActive: req.user.is_active,
                    isEmailVerified: req.user.is_email_verified
                };
            }
            next();
        };
    }

    /**
     * Middleware to check account security requirements
     */
    requireSecureAccount() {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    });
                }

                // Check if password change is required
                if (req.user.force_password_change) {
                    return res.status(403).json({
                        success: false,
                        message: 'Password change required',
                        code: 'PASSWORD_CHANGE_REQUIRED'
                    });
                }

                // Check if account is locked
                if (req.user.account_locked_until && new Date() < new Date(req.user.account_locked_until)) {
                    return res.status(423).json({
                        success: false,
                        message: 'Account is temporarily locked',
                        code: 'ACCOUNT_LOCKED',
                        locked_until: req.user.account_locked_until
                    });
                }

                next();

            } catch (error) {
                console.error('Secure account check error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Security check failed',
                    code: 'SECURITY_CHECK_FAILED'
                });
            }
        };
    }

    /**
     * Create a compound middleware for common authentication patterns
     */
    createAuthChain(options = {}) {
        const {
            required = true,
            roles = null,
            activeOnly = true,
            emailVerified = false,
            secure = false,
            ownership = false,
            resource = null,
            action = null
        } = options;

        const middlewares = [];

        // Add authentication
        middlewares.push(this.authenticateToken(!required));

        // Add user context
        middlewares.push(this.addUserContext());

        if (required) {
            // Add active user check
            if (activeOnly) {
                middlewares.push(this.requireActiveUser());
            }

            // Add email verification check
            if (emailVerified) {
                middlewares.push(this.requireEmailVerification());
            }

            // Add security checks
            if (secure) {
                middlewares.push(this.requireSecureAccount());
            }

            // Add role check
            if (roles) {
                middlewares.push(this.requireRole(roles, ownership));
            }

            // Add ownership check
            if (ownership && !roles) {
                middlewares.push(this.requireOwnership());
            }

            // Add permission check
            if (resource && action) {
                middlewares.push(this.requirePermission(resource, action));
            }
        }

        return middlewares;
    }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Export commonly used middleware functions
module.exports = {
    // Class for advanced usage
    AuthMiddleware,

    // Instance methods
    authenticateToken: authMiddleware.authenticateToken.bind(authMiddleware),
    requireAuth: authMiddleware.requireAuth.bind(authMiddleware),
    optionalAuth: authMiddleware.optionalAuth.bind(authMiddleware),
    requireRole: authMiddleware.requireRole.bind(authMiddleware),
    requireAdmin: authMiddleware.requireAdmin.bind(authMiddleware),
    requireOrganizer: authMiddleware.requireOrganizer.bind(authMiddleware),
    requireActiveUser: authMiddleware.requireActiveUser.bind(authMiddleware),
    requireEmailVerification: authMiddleware.requireEmailVerification.bind(authMiddleware),
    requirePermission: authMiddleware.requirePermission.bind(authMiddleware),
    requireOwnership: authMiddleware.requireOwnership.bind(authMiddleware),
    requireSecureAccount: authMiddleware.requireSecureAccount.bind(authMiddleware),
    addUserContext: authMiddleware.addUserContext.bind(authMiddleware),
    createAuthChain: authMiddleware.createAuthChain.bind(authMiddleware),

    // Convenience combinations
    auth: {
        // Basic authentication
        basic: authMiddleware.createAuthChain({ required: true }),
        
        // Optional authentication
        optional: authMiddleware.createAuthChain({ required: false }),
        
        // Admin only
        admin: authMiddleware.createAuthChain({ 
            required: true, 
            roles: ['admin'] 
        }),
        
        // Organizer or admin
        organizer: authMiddleware.createAuthChain({ 
            required: true, 
            roles: ['admin', 'organizer'] 
        }),
        
        // Customer with email verification
        customer: authMiddleware.createAuthChain({ 
            required: true, 
            roles: ['customer'], 
            emailVerified: true 
        }),
        
        // Secure account required
        secure: authMiddleware.createAuthChain({ 
            required: true, 
            secure: true 
        }),
        
        // Owner or admin
        owner: authMiddleware.createAuthChain({ 
            required: true, 
            ownership: true 
        })
    }
};
