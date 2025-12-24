const { getPgPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Booking Model - Clean implementation matching database schema
 */
class Booking {
    /**
     * Generate booking reference
     */
    static generateReference() {
        return 'EVT' + Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    /**
     * Find booking by ID
     */
    static async findById(id) {
        const pool = getPgPool();
        const query = `
            SELECT b.*, 
                   e.title as event_title, 
                   e.event_date, 
                   e.venue_name,
                   e.poster_image_url as event_image,
                   e.venue_address
            FROM bookings b
            JOIN events e ON b.event_id = e.id
            WHERE b.id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] ? this.format(result.rows[0]) : null;
    }

    /**
     * Find booking by reference
     */
    static async findByReference(reference) {
        const pool = getPgPool();
        const query = `
            SELECT b.*, 
                   e.title as event_title, 
                   e.event_date, 
                   e.venue_name,
                   e.poster_image_url as event_image,
                   e.venue_address
            FROM bookings b
            JOIN events e ON b.event_id = e.id
            WHERE b.booking_reference = $1
        `;
        const result = await pool.query(query, [reference]);
        return result.rows[0] ? this.format(result.rows[0]) : null;
    }

    /**
     * Find bookings by user
     */
    static async findByUserId(userId, options = {}) {
        const pool = getPgPool();
        const { limit = 20, offset = 0 } = options;
        
        const query = `
            SELECT b.*, e.title as event_title, e.event_date, e.venue_name, e.poster_image_url as event_image
            FROM bookings b
            JOIN events e ON b.event_id = e.id
            WHERE b.user_id = $1
            ORDER BY b.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const result = await pool.query(query, [userId, limit, offset]);
        return result.rows.map(this.format);
    }

    /**
     * Find bookings by event
     */
    static async findByEventId(eventId, options = {}) {
        const pool = getPgPool();
        const { limit = 100, offset = 0 } = options;
        
        const query = `
            SELECT b.* FROM bookings b
            WHERE b.event_id = $1
            ORDER BY b.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const result = await pool.query(query, [eventId, limit, offset]);
        return result.rows.map(this.format);
    }

    /**
     * Create a new booking
     */
    static async create(data) {
        const pool = getPgPool();
        const id = uuidv4();
        const reference = this.generateReference();
        
        // Calculate amounts
        const baseAmount = parseFloat(data.baseAmount || data.totalAmount || 0);
        const feesAmount = parseFloat(data.feesAmount || 0);
        const taxAmount = parseFloat(data.taxAmount || 0);
        const discountAmount = parseFloat(data.discountAmount || 0);
        const totalAmount = baseAmount + feesAmount + taxAmount - discountAmount;

        // Build seat_prices from seats data with full details
        const seatPrices = data.seats ? data.seats.map(s => ({
            seatId: s.id,
            seatLabel: s.seatLabel || s.label || `${s.row || s.rowLabel || s.row_identifier}-${s.number || s.seatNumber || s.seat_number}`,
            row: s.row || s.rowLabel || s.row_identifier || 'A',
            number: s.number || s.seatNumber || s.seat_number || 1,
            section: s.section || s.category || 'Standard',
            category: s.section || s.category || 'Standard',
            price: parseFloat(s.price || s.currentPrice || s.current_price || 0)
        })) : [];

        const query = `
            INSERT INTO bookings (
                id, booking_reference, user_id, event_id,
                customer_email, customer_first_name, customer_last_name, customer_phone,
                total_seats, base_amount, fees_amount, tax_amount, discount_amount, total_amount, 
                seat_prices, currency, status, payment_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING *
        `;

        const values = [
            id, reference, data.userId || null, data.eventId,
            data.customerEmail, data.customerFirstName, data.customerLastName, data.customerPhone || null,
            data.totalSeats || seatPrices.length || 1, baseAmount, feesAmount, taxAmount, discountAmount, totalAmount,
            JSON.stringify(seatPrices), data.currency || 'INR', data.status || 'pending', data.paymentStatus || 'pending'
        ];

        const result = await pool.query(query, values);
        return this.format(result.rows[0]);
    }

    /**
     * Add seats to booking - DEPRECATED: seats are now stored in seat_prices JSON column
     * This method is kept for backwards compatibility but does nothing
     */
    static async addSeats(bookingId, seats) {
        // Seats are now stored in seat_prices JSON column during booking creation
        // No separate booking_seats table is used
        return;
    }

    /**
     * Get booking seats from seat_prices JSON column
     */
    static async getSeats(bookingId) {
        const pool = getPgPool();
        const query = `SELECT seat_prices FROM bookings WHERE id = $1`;
        const result = await pool.query(query, [bookingId]);
        if (result.rows.length === 0) return [];
        const seatPrices = result.rows[0].seat_prices;
        return Array.isArray(seatPrices) ? seatPrices : [];
    }

    /**
     * Update booking status
     */
    static async updateStatus(id, status, paymentStatus = null) {
        const pool = getPgPool();
        let query = `UPDATE bookings SET status = $2`;
        const values = [id, status];

        if (paymentStatus) {
            query += `, payment_status = $3 WHERE id = $1 RETURNING *`;
            values.push(paymentStatus);
        } else {
            query += ` WHERE id = $1 RETURNING *`;
        }

        const result = await pool.query(query, values);
        return result.rows[0] ? this.format(result.rows[0]) : null;
    }

    /**
     * Confirm booking (after payment)
     */
    static async confirm(id, paymentId) {
        const pool = getPgPool();
        const query = `
            UPDATE bookings 
            SET status = 'confirmed', payment_status = 'completed', payment_id = $2
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [id, paymentId]);
        return result.rows[0] ? this.format(result.rows[0]) : null;
    }

    /**
     * Cancel booking
     */
    static async cancel(id, reason = null) {
        const pool = getPgPool();
        const query = `
            UPDATE bookings 
            SET status = 'cancelled', notes = COALESCE(notes || ' ', '') || $2
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [id, reason || 'Cancelled by user']);
        return result.rows[0] ? this.format(result.rows[0]) : null;
    }

    /**
     * Format booking for API response
     */
    static format(booking) {
        if (!booking) return null;
        
        // Parse seat_prices if it's a string
        let seatPrices = booking.seat_prices;
        if (typeof seatPrices === 'string') {
            try {
                seatPrices = JSON.parse(seatPrices);
            } catch (e) {
                seatPrices = [];
            }
        }
        
        return {
            id: booking.id,
            bookingReference: booking.booking_reference,
            userId: booking.user_id,
            eventId: booking.event_id,
            event: {
                id: booking.event_id,
                title: booking.event_title || 'Event',
                eventDate: booking.event_date,
                venueName: booking.venue_name || 'Venue',
                venueAddress: booking.venue_address || '',
                imageUrl: booking.event_image
            },
            customer: {
                email: booking.customer_email,
                firstName: booking.customer_first_name,
                lastName: booking.customer_last_name,
                phone: booking.customer_phone
            },
            seats: seatPrices || [],
            seatPrices: seatPrices || [],
            totalSeats: booking.total_seats,
            totalAmount: parseFloat(booking.total_amount) || 0,
            baseAmount: parseFloat(booking.base_amount) || 0,
            currency: booking.currency,
            status: booking.status,
            paymentStatus: booking.payment_status,
            paymentId: booking.payment_id,
            paymentMethod: booking.payment_method,
            notes: booking.notes,
            createdAt: booking.created_at,
            updatedAt: booking.updated_at
        };
    }
}

module.exports = Booking;
