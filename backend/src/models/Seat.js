const { getPgPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Seat Model - Clean implementation matching database schema
 * Database uses: row_identifier, base_price, current_price
 */
class Seat {
    /**
     * Find seats by event ID
     */
    static async findByEventId(eventId, options = {}) {
        const pool = getPgPool();
        const { status } = options;
        
        let query = `
            SELECT id, event_id, section, row_identifier, seat_number, seat_label, 
                   seat_type, base_price, current_price,
                   status, reserved_by, reserved_until, reservation_token, created_at
            FROM seats 
            WHERE event_id = $1
        `;
        const values = [eventId];

        if (status) {
            query += ` AND status = $2`;
            values.push(status);
        }

        query += ` ORDER BY section, row_identifier, seat_number`;

        const result = await pool.query(query, values);
        return result.rows.map(this.format);
    }

    /**
     * Find seat by ID
     */
    static async findById(id) {
        const pool = getPgPool();
        const query = `SELECT * FROM seats WHERE id = $1`;
        const result = await pool.query(query, [id]);
        return result.rows[0] ? this.format(result.rows[0]) : null;
    }

    /**
     * Find seats by IDs
     */
    static async findByIds(ids) {
        const pool = getPgPool();
        const query = `SELECT * FROM seats WHERE id = ANY($1)`;
        const result = await pool.query(query, [ids]);
        return result.rows.map(this.format);
    }

    /**
     * Create seats for an event (bulk)
     */
    static async createBulk(eventId, seats) {
        const pool = getPgPool();
        const values = [];
        const placeholders = [];
        let paramCount = 1;

        for (const seat of seats) {
            const id = uuidv4();
            placeholders.push(`($${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++})`);
            values.push(
                id,
                eventId,
                seat.section || 'General',
                seat.rowLabel || seat.row || seat.row_identifier || 'A',
                seat.seatNumber || seat.number || seat.seat_number || 1,
                seat.seatLabel || `${seat.rowLabel || seat.row || 'A'}-${seat.seatNumber || seat.number || 1}`,
                seat.price || seat.base_price || 0,
                seat.price || seat.current_price || 0
            );
        }

        const query = `
            INSERT INTO seats (id, event_id, section, row_identifier, seat_number, seat_label, base_price, current_price)
            VALUES ${placeholders.join(', ')}
            RETURNING *
        `;

        const result = await pool.query(query, values);
        return result.rows.map(this.format);
    }

    /**
     * Reserve seats (temporary hold)
     * This will reserve available seats OR re-reserve expired seats
     */
    static async reserve(seatIds, userId, token, minutes = 10) {
        const pool = getPgPool();
        
        // First, release any expired reservations for these specific seats
        await pool.query(`
            UPDATE seats 
            SET status = 'available',
                reserved_by = NULL,
                reserved_until = NULL,
                reservation_token = NULL
            WHERE id = ANY($1) AND status = 'reserved' AND reserved_until < NOW()
        `, [seatIds]);
        
        // Now reserve all available seats
        const query = `
            UPDATE seats 
            SET status = 'reserved',
                reserved_by = $2,
                reserved_until = NOW() + INTERVAL '${minutes} minutes',
                reservation_token = $3
            WHERE id = ANY($1) AND status = 'available'
            RETURNING *
        `;
        const result = await pool.query(query, [seatIds, userId, token]);
        return result.rows.map(this.format);
    }

    /**
     * Confirm seats (after payment)
     */
    static async confirm(seatIds, bookingId) {
        const pool = getPgPool();
        const query = `
            UPDATE seats 
            SET status = 'booked',
                reservation_token = NULL,
                reserved_until = NULL
            WHERE id = ANY($1)
            RETURNING *
        `;
        const result = await pool.query(query, [seatIds]);
        return result.rows.map(this.format);
    }

    /**
     * Release expired reservations
     */
    static async releaseExpired() {
        const pool = getPgPool();
        const query = `
            UPDATE seats 
            SET status = 'available',
                reserved_by = NULL,
                reserved_until = NULL,
                reservation_token = NULL
            WHERE status = 'reserved' AND reserved_until < NOW()
            RETURNING id
        `;
        const result = await pool.query(query);
        return result.rows.length;
    }

    /**
     * Release seats by token
     */
    static async releaseByToken(token) {
        const pool = getPgPool();
        const query = `
            UPDATE seats 
            SET status = 'available',
                reserved_by = NULL,
                reserved_until = NULL,
                reservation_token = NULL
            WHERE reservation_token = $1
            RETURNING *
        `;
        const result = await pool.query(query, [token]);
        return result.rows.map(this.format);
    }

    /**
     * Get available seats count for event
     */
    static async getAvailableCount(eventId) {
        const pool = getPgPool();
        const query = `SELECT COUNT(*) FROM seats WHERE event_id = $1 AND status = 'available'`;
        const result = await pool.query(query, [eventId]);
        return parseInt(result.rows[0].count, 10);
    }

    /**
     * Check if seats are available (including expired reservations which are considered available)
     */
    static async checkAvailability(seatIds) {
        const pool = getPgPool();
        const query = `
            SELECT id, status, reserved_until FROM seats 
            WHERE id = ANY($1)
        `;
        const result = await pool.query(query, [seatIds]);
        
        // A seat is unavailable if it's:
        // 1. Not 'available' status AND
        // 2. Either booked OR reserved with non-expired reservation
        const unavailable = result.rows.filter(s => {
            if (s.status === 'available') return false;
            if (s.status === 'booked') return true;
            // For reserved seats, check if reservation has expired
            if (s.status === 'reserved' && s.reserved_until) {
                return new Date(s.reserved_until) > new Date(); // Still valid reservation
            }
            return true; // Any other status is unavailable
        });
        
        return {
            available: unavailable.length === 0,
            unavailableSeats: unavailable.map(s => s.id)
        };
    }

    /**
     * Format seat for API response
     */
    static format(seat) {
        if (!seat) return null;
        const price = parseFloat(seat.current_price || seat.base_price) || 0;
        return {
            id: seat.id,
            eventId: seat.event_id,
            section: seat.section,
            rowLabel: seat.row_identifier,
            row: seat.row_identifier,
            seatNumber: seat.seat_number,
            number: seat.seat_number,
            seatLabel: seat.seat_label,
            label: seat.seat_label,
            type: seat.seat_type || 'standard',
            seatType: seat.seat_type || 'standard',
            basePrice: parseFloat(seat.base_price) || 0,
            currentPrice: price,
            price: price,
            status: seat.status,
            reservedBy: seat.reserved_by,
            reservedUntil: seat.reserved_until,
            reservationToken: seat.reservation_token,
            createdAt: seat.created_at
        };
    }
}

module.exports = Seat;
