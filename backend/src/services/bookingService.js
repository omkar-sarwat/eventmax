const { v4: uuidv4 } = require('uuid');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const Event = require('../models/Event');
const Invoice = require('../models/Invoice');
const { getRedis } = require('../config/redis');

/**
 * Booking Service - Clean booking flow implementation
 */
class BookingService {
    /**
     * Start seat reservation (temporary hold)
     */
    async startReservation(eventId, seatIds, userId) {
        // First, release any expired reservations to free up seats
        try {
            const releasedCount = await Seat.releaseExpired();
            if (releasedCount > 0) {
                console.log(`Released ${releasedCount} expired seat reservations`);
            }
        } catch (e) {
            console.warn('Could not release expired seats:', e.message);
        }

        // Check if seats are available
        const availability = await Seat.checkAvailability(seatIds);
        if (!availability.available) {
            throw new Error(`Some seats are no longer available: ${availability.unavailableSeats.join(', ')}`);
        }

        // Generate reservation token
        const reservationToken = uuidv4();
        const expiresMinutes = 10;

        // Reserve seats
        const reservedSeats = await Seat.reserve(seatIds, userId, reservationToken, expiresMinutes);

        if (reservedSeats.length !== seatIds.length) {
            // Rollback if not all seats were reserved
            await Seat.releaseByToken(reservationToken);
            throw new Error('Could not reserve all seats. Please try again.');
        }

        // Calculate total
        const totalAmount = reservedSeats.reduce((sum, seat) => sum + seat.price, 0);

        // Store in Redis for quick access
        const redis = getRedis();
        if (redis) {
            try {
                await redis.setex(`reservation:${reservationToken}`, expiresMinutes * 60, JSON.stringify({
                    eventId,
                    userId,
                    seatIds,
                    totalAmount,
                    createdAt: new Date().toISOString()
                }));
            } catch (e) {
                console.warn('Redis not available, continuing without cache');
            }
        }

        return {
            reservationToken,
            seats: reservedSeats,
            totalAmount,
            expiresIn: expiresMinutes * 60, // seconds
            expiresAt: new Date(Date.now() + expiresMinutes * 60 * 1000)
        };
    }

    /**
     * Verify reservation is still valid
     */
    async verifyReservation(reservationToken) {
        // Get seats with this token
        const { getPgPool } = require('../config/db');
        const pool = getPgPool();
        
        const query = `
            SELECT * FROM seats 
            WHERE reservation_token = $1 AND status = 'reserved' AND reserved_until > NOW()
        `;
        const result = await pool.query(query, [reservationToken]);

        if (result.rows.length === 0) {
            throw new Error('Reservation expired or not found');
        }

        const seats = result.rows.map(Seat.format);
        const totalAmount = seats.reduce((sum, seat) => sum + seat.price, 0);

        return {
            valid: true,
            seats,
            totalAmount,
            expiresAt: seats[0].reservedUntil
        };
    }

    /**
     * Confirm booking (after payment)
     */
    async confirmBooking(reservationToken, customerData, paymentData = {}) {
        // Verify reservation
        const reservation = await this.verifyReservation(reservationToken);

        // Get event info
        const eventId = reservation.seats[0].eventId;
        const event = await Event.findById(eventId);
        if (!event) {
            throw new Error('Event not found');
        }

        // Calculate amounts
        const baseAmount = reservation.totalAmount;
        const feesAmount = 4; // Convenience fee
        const totalAmount = baseAmount + feesAmount;

        // Create booking with seats data for seat_prices
        const booking = await Booking.create({
            userId: customerData.userId || null,
            eventId,
            customerEmail: customerData.email,
            customerFirstName: customerData.firstName,
            customerLastName: customerData.lastName,
            customerPhone: customerData.phone,
            totalSeats: reservation.seats.length,
            baseAmount: baseAmount,
            feesAmount: feesAmount,
            totalAmount: totalAmount,
            seats: reservation.seats, // Pass seats for seat_prices JSON
            status: 'confirmed',
            paymentStatus: paymentData.paymentId ? 'completed' : 'pending'
        });

        // Confirm seats (mark as booked)
        await Seat.confirm(reservation.seats.map(s => s.id), booking.id);

        // Update event available seats
        await Event.updateAvailableSeats(eventId);

        // Create invoice with seats data for line_items
        const invoice = await Invoice.create({
            bookingId: booking.id,
            userId: customerData.userId || null,
            amount: reservation.totalAmount,
            taxAmount: 0, // No tax for now
            seats: reservation.seats,
            currency: 'INR'
        });

        // Clear Redis cache
        const redis = getRedis();
        if (redis) {
            try {
                await redis.del(`reservation:${reservationToken}`);
            } catch (e) {
                // Ignore Redis errors
            }
        }

        return {
            booking: await Booking.findById(booking.id),
            invoice,
            seats: reservation.seats
        };
    }

    /**
     * Cancel reservation (release seats)
     */
    async cancelReservation(reservationToken) {
        const releasedSeats = await Seat.releaseByToken(reservationToken);

        // Clear Redis cache
        const redis = getRedis();
        if (redis) {
            try {
                await redis.del(`reservation:${reservationToken}`);
            } catch (e) {
                // Ignore Redis errors
            }
        }

        return {
            released: releasedSeats.length,
            seats: releasedSeats
        };
    }

    /**
     * Get user bookings
     */
    async getUserBookings(userId, options = {}) {
        return Booking.findByUserId(userId, options);
    }

    /**
     * Get booking details
     */
    async getBookingDetails(bookingId, userId = null) {
        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
            throw new Error('Booking not found');
        }

        // Check authorization if userId provided
        if (userId && booking.userId !== userId) {
            throw new Error('Not authorized to view this booking');
        }

        // Get seats
        const seats = await Booking.getSeats(bookingId);

        return {
            ...booking,
            seats
        };
    }

    /**
     * Cancel booking
     */
    async cancelBooking(bookingId, userId, reason = null) {
        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
            throw new Error('Booking not found');
        }

        if (userId && booking.userId !== userId) {
            throw new Error('Not authorized to cancel this booking');
        }

        if (booking.status === 'cancelled') {
            throw new Error('Booking is already cancelled');
        }

        // Get booking seats
        const seats = await Booking.getSeats(bookingId);
        const seatIds = seats.map(s => s.seat_id);

        // Release seats
        const { getPgPool } = require('../config/db');
        const pool = getPgPool();
        await pool.query(
            `UPDATE seats SET status = 'available', reserved_by = NULL WHERE id = ANY($1)`,
            [seatIds]
        );

        // Cancel booking
        const cancelled = await Booking.cancel(bookingId, reason);

        // Update event available seats
        await Event.updateAvailableSeats(booking.eventId);

        return cancelled;
    }

    /**
     * Cleanup expired reservations
     */
    async cleanupExpiredReservations() {
        const count = await Seat.releaseExpired();
        console.log(`Released ${count} expired reservations`);
        return count;
    }
}

module.exports = BookingService;
