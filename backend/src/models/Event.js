const { getPgPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Event Model - Clean implementation matching database schema
 */
class Event {
    /**
     * Find all published events
     */
    static async findAll(options = {}) {
        const pool = getPgPool();
        const { limit = 50, offset = 0, category, city, minPrice, maxPrice, search } = options;
        
        let query = `
            SELECT e.*, c.name as category_name, c.slug as category_slug,
                   u.first_name as organizer_first_name, u.last_name as organizer_last_name
            FROM events e
            LEFT JOIN event_categories c ON e.category_id = c.id
            LEFT JOIN users u ON e.organizer_id = u.id
            WHERE e.status = 'published'
        `;
        
        const values = [];
        let paramCount = 1;

        if (category) {
            query += ` AND c.slug = $${paramCount++}`;
            values.push(category);
        }
        if (city) {
            query += ` AND LOWER(e.venue_city) = LOWER($${paramCount++})`;
            values.push(city);
        }
        if (minPrice) {
            query += ` AND e.base_price >= $${paramCount++}`;
            values.push(minPrice);
        }
        if (maxPrice) {
            query += ` AND e.base_price <= $${paramCount++}`;
            values.push(maxPrice);
        }
        if (search) {
            query += ` AND (e.title ILIKE $${paramCount} OR e.description ILIKE $${paramCount} OR e.venue_name ILIKE $${paramCount})`;
            values.push(`%${search}%`);
            paramCount++;
        }

        query += ` ORDER BY e.event_date ASC LIMIT $${paramCount++} OFFSET $${paramCount}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        return result.rows.map(this.format);
    }

    /**
     * Find featured events
     */
    static async findFeatured(limit = 6) {
        const pool = getPgPool();
        const query = `
            SELECT e.*, c.name as category_name, c.slug as category_slug
            FROM events e
            LEFT JOIN event_categories c ON e.category_id = c.id
            WHERE e.status = 'published' AND e.is_featured = TRUE AND e.event_date > NOW()
            ORDER BY e.event_date ASC
            LIMIT $1
        `;
        const result = await pool.query(query, [limit]);
        return result.rows.map(this.format);
    }

    /**
     * Find upcoming events
     */
    static async findUpcoming(limit = 10) {
        const pool = getPgPool();
        const query = `
            SELECT e.*, c.name as category_name, c.slug as category_slug
            FROM events e
            LEFT JOIN event_categories c ON e.category_id = c.id
            WHERE e.status = 'published' AND e.event_date > NOW()
            ORDER BY e.event_date ASC
            LIMIT $1
        `;
        const result = await pool.query(query, [limit]);
        return result.rows.map(this.format);
    }

    /**
     * Find event by ID
     */
    static async findById(id) {
        const pool = getPgPool();
        const query = `
            SELECT e.*, c.name as category_name, c.slug as category_slug,
                   u.first_name as organizer_first_name, u.last_name as organizer_last_name
            FROM events e
            LEFT JOIN event_categories c ON e.category_id = c.id
            LEFT JOIN users u ON e.organizer_id = u.id
            WHERE e.id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] ? this.format(result.rows[0]) : null;
    }

    /**
     * Find event by slug
     */
    static async findBySlug(slug) {
        const pool = getPgPool();
        const query = `
            SELECT e.*, c.name as category_name, c.slug as category_slug,
                   u.first_name as organizer_first_name, u.last_name as organizer_last_name
            FROM events e
            LEFT JOIN event_categories c ON e.category_id = c.id
            LEFT JOIN users u ON e.organizer_id = u.id
            WHERE e.slug = $1
        `;
        const result = await pool.query(query, [slug]);
        return result.rows[0] ? this.format(result.rows[0]) : null;
    }

    /**
     * Create a new event
     */
    static async create(data) {
        const pool = getPgPool();
        const id = uuidv4();
        const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const query = `
            INSERT INTO events (
                id, title, slug, description, short_description,
                venue_name, venue_address, venue_city, venue_state, venue_country, venue_capacity,
                event_date, end_date, doors_open, base_price, max_price, currency,
                image_url, thumbnail_url, category_id, organizer_id, status, is_featured,
                total_seats, available_seats
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
                $18, $19, $20, $21, $22, $23, $24, $24
            ) RETURNING *
        `;

        const values = [
            id, data.title, slug, data.description, data.shortDescription,
            data.venueName, data.venueAddress, data.venueCity, data.venueState, data.venueCountry || 'USA', data.venueCapacity || 100,
            data.eventDate, data.endDate, data.doorsOpen, data.basePrice || 0, data.maxPrice, data.currency || 'INR',
            data.imageUrl, data.thumbnailUrl, data.categoryId, data.organizerId, data.status || 'draft', data.isFeatured || false,
            data.totalSeats || 0
        ];

        const result = await pool.query(query, values);
        return this.format(result.rows[0]);
    }

    /**
     * Update event
     */
    static async update(id, data) {
        const pool = getPgPool();
        // Build dynamic update query
        const fields = [];
        const values = [];
        let i = 1;

        const allowedFields = ['title', 'description', 'short_description', 'venue_name', 'venue_city', 
                               'event_date', 'base_price', 'status', 'is_featured', 'image_url'];
        
        for (const [key, value] of Object.entries(data)) {
            const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            if (allowedFields.includes(dbField) && value !== undefined) {
                fields.push(`${dbField} = $${i++}`);
                values.push(value);
            }
        }

        if (fields.length === 0) return this.findById(id);

        values.push(id);
        const query = `UPDATE events SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;
        const result = await pool.query(query, values);
        return result.rows[0] ? this.format(result.rows[0]) : null;
    }

    /**
     * Update available seats count
     */
    static async updateAvailableSeats(eventId) {
        const pool = getPgPool();
        const query = `
            UPDATE events SET 
                available_seats = (SELECT COUNT(*) FROM seats WHERE event_id = $1 AND status = 'available'),
                total_seats = (SELECT COUNT(*) FROM seats WHERE event_id = $1)
            WHERE id = $1
        `;
        await pool.query(query, [eventId]);
    }

    /**
     * Get categories with event counts
     */
    static async getCategories() {
        const pool = getPgPool();
        const query = `
            SELECT c.*, 
                   COALESCE(COUNT(e.id), 0)::int as event_count
            FROM event_categories c
            LEFT JOIN events e ON e.category_id = c.id AND e.status = 'published'
            WHERE c.is_active = TRUE 
            GROUP BY c.id
            ORDER BY c.display_order, c.name
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Format event for API response
     */
    static format(event) {
        if (!event) return null;
        
        // Handle image URL - database uses poster_image_url
        const imageUrl = event.poster_image_url || event.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800';
        
        return {
            id: event.id,
            title: event.title,
            slug: event.slug,
            description: event.description,
            shortDescription: event.short_description,
            venue: {
                name: event.venue_name,
                address: event.venue_address,
                city: event.venue_city,
                state: event.venue_state,
                country: event.venue_country,
                capacity: event.venue_capacity
            },
            venueName: event.venue_name,
            venueCity: event.venue_city,
            eventDate: event.event_date,
            endDate: event.end_date,
            doorsOpen: event.doors_open,
            doorsOpenTime: event.doors_open_time,
            eventEndTime: event.event_end_time,
            basePrice: parseFloat(event.base_price) || 0,
            maxPrice: event.max_price ? parseFloat(event.max_price) : null,
            currency: event.currency || 'INR',
            posterImageUrl: imageUrl,
            imageUrl: imageUrl,
            thumbnailUrl: event.banner_image_url || imageUrl,
            category: event.category_name ? {
                id: event.category_id,
                name: event.category_name,
                slug: event.category_slug
            } : null,
            categoryId: event.category_id,
            organizer: event.organizer_first_name ? {
                id: event.organizer_id,
                name: `${event.organizer_first_name} ${event.organizer_last_name}`
            } : null,
            organizerId: event.organizer_id,
            status: event.status,
            isFeatured: event.is_featured,
            isSoldOut: event.is_sold_out,
            totalSeats: event.total_seats,
            availableSeats: event.available_seats,
            maxSeatsPerBooking: event.max_seats_per_booking || 10,
            createdAt: event.created_at,
            updatedAt: event.updated_at
        };
    }
}

module.exports = Event;
