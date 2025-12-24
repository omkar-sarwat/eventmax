const Joi = require('joi');
const { validationError } = require('./errorHandling');

/**
 * EventMax Validation Middleware
 * Comprehensive request validation using Joi schemas
 * Provides validation for all API endpoints with detailed error messages
 */
class ValidationMiddleware {
    constructor() {
        this.defaultOptions = {
            abortEarly: false, // Return all validation errors
            allowUnknown: false, // Don't allow unknown fields
            stripUnknown: true, // Remove unknown fields
            convert: true // Convert values to correct types
        };
    }

    /**
     * Generic validation middleware
     * @param {Object} schema - Joi validation schema
     * @param {string} target - Target to validate ('body', 'query', 'params')
     */
    validate(schema, target = 'body') {
        return (req, res, next) => {
            try {
                const dataToValidate = req[target];
                
                const { error, value } = schema.validate(dataToValidate, this.defaultOptions);

                if (error) {
                    const details = error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message,
                        value: detail.context?.value
                    }));

                    return res.status(400).json({
                        success: false,
                        message: 'Validation failed',
                        code: 'VALIDATION_ERROR',
                        details
                    });
                }

                // Replace the original data with validated and sanitized data
                req[target] = value;
                next();

            } catch (validationError) {
                console.error('Validation middleware error:', validationError);
                return res.status(500).json({
                    success: false,
                    message: 'Validation system error',
                    code: 'VALIDATION_SYSTEM_ERROR'
                });
            }
        };
    }

    /**
     * Validate request body
     */
    validateBody(schema) {
        return this.validate(schema, 'body');
    }

    /**
     * Validate query parameters
     */
    validateQuery(schema) {
        return this.validate(schema, 'query');
    }

    /**
     * Validate URL parameters
     */
    validateParams(schema) {
        return this.validate(schema, 'params');
    }

    /**
     * User validation schemas
     */
    getUserSchemas() {
        return {
            register: Joi.object({
                email: Joi.string()
                    .email()
                    .required()
                    .messages({
                        'string.email': 'Please provide a valid email address',
                        'any.required': 'Email is required'
                    }),
                password: Joi.string()
                    .min(8)
                    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
                    .required()
                    .messages({
                        'string.min': 'Password must be at least 8 characters long',
                        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                        'any.required': 'Password is required'
                    }),
                confirmPassword: Joi.string()
                    .valid(Joi.ref('password'))
                    .optional()
                    .messages({
                        'any.only': 'Passwords do not match'
                    }),
                firstName: Joi.string()
                    .min(2)
                    .max(50)
                    .pattern(/^[a-zA-Z\s'-]+$/)
                    .required()
                    .messages({
                        'string.min': 'First name must be at least 2 characters long',
                        'string.max': 'First name cannot exceed 50 characters',
                        'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes',
                        'any.required': 'First name is required'
                    }),
                lastName: Joi.string()
                    .min(2)
                    .max(50)
                    .pattern(/^[a-zA-Z\s'-]+$/)
                    .required()
                    .messages({
                        'string.min': 'Last name must be at least 2 characters long',
                        'string.max': 'Last name cannot exceed 50 characters',
                        'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes',
                        'any.required': 'Last name is required'
                    }),
                phone: Joi.string()
                    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
                    .optional()
                    .messages({
                        'string.pattern.base': 'Please provide a valid phone number'
                    }),
                dateOfBirth: Joi.date()
                    .max('now')
                    .min('1900-01-01')
                    .optional()
                    .messages({
                        'date.max': 'Date of birth cannot be in the future',
                        'date.min': 'Please provide a valid date of birth'
                    }),
                role: Joi.string()
                    .valid('customer', 'organizer')
                    .default('customer')
                    .messages({
                        'any.only': 'Role must be either customer or organizer'
                    })
            }),

            login: Joi.object({
                email: Joi.string()
                    .email()
                    .required()
                    .messages({
                        'string.email': 'Please provide a valid email address',
                        'any.required': 'Email is required'
                    }),
                password: Joi.string()
                    .required()
                    .messages({
                        'any.required': 'Password is required'
                    }),
                rememberMe: Joi.boolean()
                    .default(false)
            }),

            updateProfile: Joi.object({
                firstName: Joi.string()
                    .min(2)
                    .max(50)
                    .pattern(/^[a-zA-Z\s'-]+$/)
                    .optional(),
                lastName: Joi.string()
                    .min(2)
                    .max(50)
                    .pattern(/^[a-zA-Z\s'-]+$/)
                    .optional(),
                phone: Joi.string()
                    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
                    .optional()
                    .allow(''),
                dateOfBirth: Joi.date()
                    .max('now')
                    .min('1900-01-01')
                    .optional()
            }),

            changePassword: Joi.object({
                currentPassword: Joi.string()
                    .required()
                    .messages({
                        'any.required': 'Current password is required'
                    }),
                newPassword: Joi.string()
                    .min(8)
                    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
                    .required()
                    .messages({
                        'string.min': 'New password must be at least 8 characters long',
                        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                        'any.required': 'New password is required'
                    }),
                confirmPassword: Joi.string()
                    .valid(Joi.ref('newPassword'))
                    .required()
                    .messages({
                        'any.only': 'Passwords do not match',
                        'any.required': 'Password confirmation is required'
                    })
            }),

            forgotPassword: Joi.object({
                email: Joi.string()
                    .email()
                    .required()
                    .messages({
                        'string.email': 'Please provide a valid email address',
                        'any.required': 'Email is required'
                    })
            }),

            resetPassword: Joi.object({
                token: Joi.string()
                    .required()
                    .messages({
                        'any.required': 'Reset token is required'
                    }),
                password: Joi.string()
                    .min(8)
                    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
                    .required()
                    .messages({
                        'string.min': 'Password must be at least 8 characters long',
                        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                        'any.required': 'Password is required'
                    }),
                confirmPassword: Joi.string()
                    .valid(Joi.ref('password'))
                    .required()
                    .messages({
                        'any.only': 'Passwords do not match',
                        'any.required': 'Password confirmation is required'
                    })
            })
        };
    }

    /**
     * Event validation schemas
     */
    getEventSchemas() {
        return {
            create: Joi.object({
                name: Joi.string()
                    .min(3)
                    .max(200)
                    .required()
                    .messages({
                        'string.min': 'Event name must be at least 3 characters long',
                        'string.max': 'Event name cannot exceed 200 characters',
                        'any.required': 'Event name is required'
                    }),
                description: Joi.string()
                    .max(5000)
                    .required()
                    .messages({
                        'string.max': 'Description cannot exceed 5000 characters',
                        'any.required': 'Event description is required'
                    }),
                categoryId: Joi.string()
                    .uuid()
                    .required()
                    .messages({
                        'string.uuid': 'Please provide a valid category ID',
                        'any.required': 'Event category is required'
                    }),
                venueId: Joi.string()
                    .uuid()
                    .required()
                    .messages({
                        'string.uuid': 'Please provide a valid venue ID',
                        'any.required': 'Event venue is required'
                    }),
                eventDate: Joi.date()
                    .min('now')
                    .required()
                    .messages({
                        'date.min': 'Event date must be in the future',
                        'any.required': 'Event date is required'
                    }),
                startTime: Joi.string()
                    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                    .required()
                    .messages({
                        'string.pattern.base': 'Start time must be in HH:mm format',
                        'any.required': 'Start time is required'
                    }),
                endTime: Joi.string()
                    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                    .required()
                    .messages({
                        'string.pattern.base': 'End time must be in HH:mm format',
                        'any.required': 'End time is required'
                    }),
                status: Joi.string()
                    .valid('draft', 'published', 'cancelled')
                    .default('draft'),
                isPublic: Joi.boolean()
                    .default(true),
                maxAttendees: Joi.number()
                    .integer()
                    .min(1)
                    .max(100000)
                    .optional()
                    .messages({
                        'number.min': 'Maximum attendees must be at least 1',
                        'number.max': 'Maximum attendees cannot exceed 100,000'
                    }),
                tags: Joi.array()
                    .items(Joi.string().max(50))
                    .max(10)
                    .optional()
                    .messages({
                        'array.max': 'Cannot have more than 10 tags'
                    }),
                imageUrl: Joi.string()
                    .uri()
                    .optional()
                    .messages({
                        'string.uri': 'Please provide a valid image URL'
                    })
            }),

            update: Joi.object({
                name: Joi.string()
                    .min(3)
                    .max(200)
                    .optional(),
                description: Joi.string()
                    .max(5000)
                    .optional(),
                categoryId: Joi.string()
                    .uuid()
                    .optional(),
                eventDate: Joi.date()
                    .min('now')
                    .optional(),
                startTime: Joi.string()
                    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                    .optional(),
                endTime: Joi.string()
                    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                    .optional(),
                status: Joi.string()
                    .valid('draft', 'published', 'cancelled')
                    .optional(),
                isPublic: Joi.boolean()
                    .optional(),
                maxAttendees: Joi.number()
                    .integer()
                    .min(1)
                    .max(100000)
                    .optional(),
                tags: Joi.array()
                    .items(Joi.string().max(50))
                    .max(10)
                    .optional(),
                imageUrl: Joi.string()
                    .uri()
                    .optional()
                    .allow('')
            }),

            search: Joi.object({
                q: Joi.string()
                    .max(200)
                    .optional(),
                category: Joi.string()
                    .uuid()
                    .optional(),
                location: Joi.string()
                    .max(100)
                    .optional(),
                startDate: Joi.date()
                    .optional(),
                endDate: Joi.date()
                    .optional(),
                minPrice: Joi.number()
                    .min(0)
                    .optional(),
                maxPrice: Joi.number()
                    .min(0)
                    .optional(),
                page: Joi.number()
                    .integer()
                    .min(1)
                    .default(1),
                limit: Joi.number()
                    .integer()
                    .min(1)
                    .max(100)
                    .default(20),
                sortBy: Joi.string()
                    .valid('date', 'name', 'price', 'popularity')
                    .default('date'),
                sortOrder: Joi.string()
                    .valid('asc', 'desc')
                    .default('asc')
            })
        };
    }

    /**
     * Booking validation schemas
     */
    getBookingSchemas() {
        return {
            create: Joi.object({
                eventId: Joi.string()
                    .uuid()
                    .required()
                    .messages({
                        'string.uuid': 'Please provide a valid event ID',
                        'any.required': 'Event ID is required'
                    }),
                seatIds: Joi.array()
                    .items(Joi.string().uuid())
                    .min(1)
                    .max(10)
                    .required()
                    .messages({
                        'array.min': 'At least one seat must be selected',
                        'array.max': 'Cannot book more than 10 seats at once',
                        'any.required': 'Seat selection is required'
                    }),
                customerInfo: Joi.object({
                    firstName: Joi.string()
                        .min(2)
                        .max(50)
                        .required(),
                    lastName: Joi.string()
                        .min(2)
                        .max(50)
                        .required(),
                    email: Joi.string()
                        .email()
                        .required(),
                    phone: Joi.string()
                        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
                        .required()
                }).required(),
                paymentMethod: Joi.object({
                    type: Joi.string()
                        .valid('credit_card', 'debit_card', 'paypal', 'bank_transfer')
                        .required(),
                    cardNumber: Joi.when('type', {
                        is: Joi.string().valid('credit_card', 'debit_card'),
                        then: Joi.string()
                            .pattern(/^[0-9]{13,19}$/)
                            .required(),
                        otherwise: Joi.optional()
                    }),
                    expiryMonth: Joi.when('type', {
                        is: Joi.string().valid('credit_card', 'debit_card'),
                        then: Joi.number()
                            .integer()
                            .min(1)
                            .max(12)
                            .required(),
                        otherwise: Joi.optional()
                    }),
                    expiryYear: Joi.when('type', {
                        is: Joi.string().valid('credit_card', 'debit_card'),
                        then: Joi.number()
                            .integer()
                            .min(new Date().getFullYear())
                            .required(),
                        otherwise: Joi.optional()
                    }),
                    cvv: Joi.when('type', {
                        is: Joi.string().valid('credit_card', 'debit_card'),
                        then: Joi.string()
                            .pattern(/^[0-9]{3,4}$/)
                            .required(),
                        otherwise: Joi.optional()
                    }),
                    holderName: Joi.when('type', {
                        is: Joi.string().valid('credit_card', 'debit_card'),
                        then: Joi.string()
                            .min(2)
                            .max(100)
                            .required(),
                        otherwise: Joi.optional()
                    })
                }).required(),
                specialRequests: Joi.string()
                    .max(1000)
                    .optional()
            }),

            update: Joi.object({
                status: Joi.string()
                    .valid('pending', 'confirmed', 'cancelled', 'refunded')
                    .optional(),
                specialRequests: Joi.string()
                    .max(1000)
                    .optional()
            }),

            cancel: Joi.object({
                reason: Joi.string()
                    .max(500)
                    .required()
                    .messages({
                        'any.required': 'Cancellation reason is required'
                    }),
                refundRequested: Joi.boolean()
                    .default(true)
            })
        };
    }

    /**
     * Common validation schemas
     */
    getCommonSchemas() {
        return {
            pagination: Joi.object({
                page: Joi.number()
                    .integer()
                    .min(1)
                    .default(1),
                limit: Joi.number()
                    .integer()
                    .min(1)
                    .max(100)
                    .default(20),
                sortBy: Joi.string()
                    .optional(),
                sortOrder: Joi.string()
                    .valid('asc', 'desc')
                    .default('asc')
            }),

            uuidParam: Joi.object({
                id: Joi.string()
                    .uuid()
                    .required()
                    .messages({
                        'string.uuid': 'Please provide a valid ID',
                        'any.required': 'ID is required'
                    })
            }),

            contact: Joi.object({
                name: Joi.string()
                    .min(2)
                    .max(100)
                    .required(),
                email: Joi.string()
                    .email()
                    .required(),
                subject: Joi.string()
                    .min(5)
                    .max(200)
                    .required(),
                message: Joi.string()
                    .min(10)
                    .max(2000)
                    .required()
            }),

            fileUpload: Joi.object({
                filename: Joi.string()
                    .max(255)
                    .pattern(/^[a-zA-Z0-9_.-]+$/)
                    .required(),
                mimetype: Joi.string()
                    .valid(
                        'image/jpeg',
                        'image/jpg',
                        'image/png',
                        'image/gif',
                        'image/webp',
                        'application/pdf'
                    )
                    .required(),
                size: Joi.number()
                    .integer()
                    .max(10 * 1024 * 1024) // 10MB
                    .required()
            })
        };
    }

    /**
     * Conditional validation based on user role
     */
    validateByRole(schemas) {
        return (req, res, next) => {
            const userRole = req.user?.role || 'guest';
            const schema = schemas[userRole];

            if (!schema) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied for this role',
                    code: 'ROLE_ACCESS_DENIED'
                });
            }

            return this.validateBody(schema)(req, res, next);
        };
    }

    /**
     * Custom validation function
     */
    custom(validationFn) {
        return async (req, res, next) => {
            try {
                const result = await validationFn(req);
                
                if (result.isValid) {
                    next();
                } else {
                    return res.status(400).json({
                        success: false,
                        message: result.message || 'Validation failed',
                        code: 'CUSTOM_VALIDATION_ERROR',
                        details: result.details || []
                    });
                }
            } catch (error) {
                console.error('Custom validation error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Validation system error',
                    code: 'VALIDATION_SYSTEM_ERROR'
                });
            }
        };
    }

    /**
     * Validate multiple targets (body, query, params)
     */
    validateMultiple(schemas) {
        return (req, res, next) => {
            const validationPromises = Object.keys(schemas).map(target => {
                return new Promise((resolve) => {
                    const { error, value } = schemas[target].validate(req[target], this.defaultOptions);
                    resolve({ target, error, value });
                });
            });

            Promise.all(validationPromises)
                .then(results => {
                    const errors = results.filter(result => result.error);
                    
                    if (errors.length > 0) {
                        const allDetails = errors.reduce((acc, { target, error }) => {
                            const details = error.details.map(detail => ({
                                target,
                                field: detail.path.join('.'),
                                message: detail.message,
                                value: detail.context?.value
                            }));
                            return acc.concat(details);
                        }, []);

                        return res.status(400).json({
                            success: false,
                            message: 'Validation failed',
                            code: 'VALIDATION_ERROR',
                            details: allDetails
                        });
                    }

                    // Update req with validated values
                    results.forEach(({ target, value }) => {
                        req[target] = value;
                    });

                    next();
                })
                .catch(error => {
                    console.error('Multiple validation error:', error);
                    return res.status(500).json({
                        success: false,
                        message: 'Validation system error',
                        code: 'VALIDATION_SYSTEM_ERROR'
                    });
                });
        };
    }
}

// Create singleton instance
const validationMiddleware = new ValidationMiddleware();

// Get schema collections
const userSchemas = validationMiddleware.getUserSchemas();
const eventSchemas = validationMiddleware.getEventSchemas();
const bookingSchemas = validationMiddleware.getBookingSchemas();
const commonSchemas = validationMiddleware.getCommonSchemas();

module.exports = {
    // Class for advanced usage
    ValidationMiddleware,

    // Main validation functions
    validate: validationMiddleware.validate.bind(validationMiddleware),
    validateBody: validationMiddleware.validateBody.bind(validationMiddleware),
    validateQuery: validationMiddleware.validateQuery.bind(validationMiddleware),
    validateParams: validationMiddleware.validateParams.bind(validationMiddleware),
    validateByRole: validationMiddleware.validateByRole.bind(validationMiddleware),
    validateMultiple: validationMiddleware.validateMultiple.bind(validationMiddleware),
    custom: validationMiddleware.custom.bind(validationMiddleware),

    // Schema collections
    schemas: {
        user: userSchemas,
        event: eventSchemas,
        booking: bookingSchemas,
        common: commonSchemas
    },

    // Convenience validation middleware
    validation: {
        // User validations
        userRegister: validationMiddleware.validateBody(userSchemas.register),
        userLogin: validationMiddleware.validateBody(userSchemas.login),
        userUpdate: validationMiddleware.validateBody(userSchemas.updateProfile),
        userChangePassword: validationMiddleware.validateBody(userSchemas.changePassword),
        userForgotPassword: validationMiddleware.validateBody(userSchemas.forgotPassword),
        userResetPassword: validationMiddleware.validateBody(userSchemas.resetPassword),

        // Event validations
        eventCreate: validationMiddleware.validateBody(eventSchemas.create),
        eventUpdate: validationMiddleware.validateBody(eventSchemas.update),
        eventSearch: validationMiddleware.validateQuery(eventSchemas.search),

        // Booking validations
        bookingCreate: validationMiddleware.validateBody(bookingSchemas.create),
        bookingUpdate: validationMiddleware.validateBody(bookingSchemas.update),
        bookingCancel: validationMiddleware.validateBody(bookingSchemas.cancel),

        // Common validations
        pagination: validationMiddleware.validateQuery(commonSchemas.pagination),
        uuidParam: validationMiddleware.validateParams(commonSchemas.uuidParam),
        contact: validationMiddleware.validateBody(commonSchemas.contact),
        fileUpload: validationMiddleware.validateBody(commonSchemas.fileUpload)
    }
};
