/**
 * EventMax API Routes - Clean, production-ready implementation
 */

const express = require('express');
const router = express.Router();

// Controllers
const AuthController = require('../controllers/AuthController');
const EventController = require('../controllers/eventController');
const BookingController = require('../controllers/BookingController');
const InvoiceController = require('../controllers/InvoiceController');

// Auth middleware
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'eventmax-secret-key-change-in-production';

/**
 * Authentication Middleware
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Optional Authentication (for routes that work with or without auth)
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            req.user = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            // Invalid token, continue without auth
        }
    }
    next();
};

/**
 * Admin Authorization Middleware
 */
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// ===================
// HEALTH CHECK
// ===================
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

// ===================
// STATS ROUTE
// ===================
router.get('/stats', async (req, res) => {
    try {
        const { getPgPool } = require('../config/db');
        const pool = getPgPool();
        
        const [eventsResult, usersResult, bookingsResult, venuesResult] = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM events WHERE status = $1', ['published']),
            pool.query('SELECT COUNT(*) as count FROM users'),
            pool.query('SELECT COUNT(*) as count FROM bookings'),
            pool.query('SELECT COUNT(DISTINCT venue_name) as count FROM events WHERE venue_name IS NOT NULL')
        ]);
        
        res.json({
            success: true,
            data: {
                totalEvents: parseInt(eventsResult.rows[0].count, 10),
                totalUsers: parseInt(usersResult.rows[0].count, 10),
                totalBookings: parseInt(bookingsResult.rows[0].count, 10),
                totalVenues: parseInt(venuesResult.rows[0].count, 10)
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ===================
// AUTH ROUTES
// ===================
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/logout', AuthController.logout);
router.post('/auth/refresh', AuthController.refresh);
router.get('/auth/me', authenticate, AuthController.getMe);
router.put('/auth/profile', authenticate, AuthController.updateProfile);

// ===================
// EVENT ROUTES
// ===================
router.get('/events', EventController.getAll);
router.get('/events/featured', EventController.getFeatured);
router.get('/events/upcoming', EventController.getUpcoming);
router.get('/events/categories', EventController.getCategories);
router.get('/events/:id', EventController.getById);
router.get('/events/:id/seats', EventController.getSeats);

// Admin event routes
router.post('/events', authenticate, requireAdmin, EventController.create);
router.put('/events/:id', authenticate, requireAdmin, EventController.update);
router.post('/events/:id/seats', authenticate, requireAdmin, EventController.createSeats);

// ===================
// BOOKING ROUTES
// ===================
router.post('/bookings/reserve', optionalAuth, BookingController.reserve);
router.get('/bookings/verify/:token', BookingController.verify);
router.post('/bookings/confirm', optionalAuth, BookingController.confirm);
router.delete('/bookings/reserve/:token', BookingController.cancelReservation);

// Authenticated booking routes
router.get('/bookings', authenticate, BookingController.getUserBookings);
router.get('/bookings/:id', authenticate, BookingController.getBooking);
router.get('/bookings/reference/:reference', BookingController.getByReference);
router.post('/bookings/:id/cancel', authenticate, BookingController.cancel);

// ===================
// INVOICE ROUTES
// ===================
router.get('/invoices', authenticate, InvoiceController.getUserInvoices);
router.get('/invoices/:id', authenticate, InvoiceController.getInvoice);
router.get('/invoices/number/:invoiceNumber', InvoiceController.getByNumber);
router.get('/invoices/:id/download', authenticate, InvoiceController.download);

// ===================
// 404 HANDLER
// ===================
router.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

module.exports = router;
