const BookingService = require('../services/bookingService');
const Booking = require('../models/Booking');

const bookingService = new BookingService();

/**
 * Booking Controller - Clean booking flow endpoints
 */
const BookingController = {
    /**
     * POST /api/bookings/reserve
     * Start seat reservation (temporary hold)
     */
    async reserve(req, res) {
        try {
            const { eventId, seatIds } = req.body;
            const userId = req.user?.userId || null;

            if (!eventId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
                return res.status(400).json({ error: 'Event ID and seat IDs are required' });
            }

            const reservation = await bookingService.startReservation(eventId, seatIds, userId);

            res.status(200).json({
                success: true,
                data: reservation
            });
        } catch (error) {
            console.error('Reserve error:', error.message);
            
            if (error.message.includes('available')) {
                return res.status(409).json({ error: error.message });
            }
            
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/bookings/verify/:token
     * Verify reservation is still valid
     */
    async verify(req, res) {
        try {
            const { token } = req.params;

            const reservation = await bookingService.verifyReservation(token);

            res.status(200).json({
                success: true,
                data: reservation
            });
        } catch (error) {
            console.error('Verify error:', error.message);
            
            if (error.message.includes('expired') || error.message.includes('not found')) {
                return res.status(404).json({ error: error.message });
            }
            
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * POST /api/bookings/confirm
     * Confirm booking after payment
     */
    async confirm(req, res) {
        try {
            const { reservationToken, customer, payment } = req.body;

            if (!reservationToken) {
                return res.status(400).json({ error: 'Reservation token is required' });
            }
            if (!customer || !customer.email || !customer.firstName || !customer.lastName) {
                return res.status(400).json({ error: 'Customer details are required' });
            }

            const customerData = {
                userId: req.user?.userId || null,
                email: customer.email,
                firstName: customer.firstName,
                lastName: customer.lastName,
                phone: customer.phone
            };

            const result = await bookingService.confirmBooking(reservationToken, customerData, payment || {});

            res.status(200).json({
                success: true,
                message: 'Booking confirmed successfully',
                data: result
            });
        } catch (error) {
            console.error('Confirm error:', error.message);
            
            if (error.message.includes('expired') || error.message.includes('not found')) {
                return res.status(404).json({ error: error.message });
            }
            
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * DELETE /api/bookings/reserve/:token
     * Cancel reservation (release seats)
     */
    async cancelReservation(req, res) {
        try {
            const { token } = req.params;

            const result = await bookingService.cancelReservation(token);

            res.status(200).json({
                success: true,
                message: 'Reservation cancelled',
                data: result
            });
        } catch (error) {
            console.error('Cancel reservation error:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/bookings
     * Get user's bookings
     */
    async getUserBookings(req, res) {
        try {
            const userId = req.user.userId;
            const { limit, offset } = req.query;

            const bookings = await bookingService.getUserBookings(userId, {
                limit: limit ? parseInt(limit) : 20,
                offset: offset ? parseInt(offset) : 0
            });

            res.status(200).json({
                success: true,
                data: { bookings }
            });
        } catch (error) {
            console.error('Get bookings error:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/bookings/:id
     * Get booking details
     */
    async getBooking(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;

            const booking = await bookingService.getBookingDetails(id, userId);

            res.status(200).json({
                success: true,
                data: { booking }
            });
        } catch (error) {
            console.error('Get booking error:', error.message);
            
            if (error.message.includes('not found')) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('authorized')) {
                return res.status(403).json({ error: error.message });
            }
            
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/bookings/reference/:reference
     * Get booking by reference
     */
    async getByReference(req, res) {
        try {
            const { reference } = req.params;

            const booking = await Booking.findByReference(reference);
            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            res.status(200).json({
                success: true,
                data: { booking }
            });
        } catch (error) {
            console.error('Get by reference error:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * POST /api/bookings/:id/cancel
     * Cancel booking
     */
    async cancel(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const userId = req.user?.userId;

            const booking = await bookingService.cancelBooking(id, userId, reason);

            res.status(200).json({
                success: true,
                message: 'Booking cancelled successfully',
                data: { booking }
            });
        } catch (error) {
            console.error('Cancel booking error:', error.message);
            
            if (error.message.includes('not found')) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('authorized')) {
                return res.status(403).json({ error: error.message });
            }
            if (error.message.includes('already cancelled')) {
                return res.status(400).json({ error: error.message });
            }
            
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = BookingController;
