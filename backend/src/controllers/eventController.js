const Event = require('../models/Event');
const Seat = require('../models/Seat');

/**
 * Event Controller - Clean event management endpoints
 */
const EventController = {
    /**
     * GET /api/events
     */
    async getAll(req, res) {
        try {
            const { category, city, minPrice, maxPrice, search, limit, offset } = req.query;

            const events = await Event.findAll({
                category,
                city,
                minPrice: minPrice ? parseFloat(minPrice) : undefined,
                maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                search,
                limit: limit ? parseInt(limit) : 50,
                offset: offset ? parseInt(offset) : 0
            });

            res.status(200).json({
                success: true,
                data: { events },
                meta: {
                    count: events.length,
                    limit: parseInt(limit) || 50,
                    offset: parseInt(offset) || 0
                }
            });
        } catch (error) {
            console.error('Get events error:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/events/featured
     */
    async getFeatured(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 6;
            const events = await Event.findFeatured(limit);

            res.status(200).json({
                success: true,
                data: { events }
            });
        } catch (error) {
            console.error('Get featured error:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/events/upcoming
     */
    async getUpcoming(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const events = await Event.findUpcoming(limit);

            res.status(200).json({
                success: true,
                data: { events }
            });
        } catch (error) {
            console.error('Get upcoming error:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/events/categories
     */
    async getCategories(req, res) {
        try {
            const categories = await Event.getCategories();

            res.status(200).json({
                success: true,
                data: { categories }
            });
        } catch (error) {
            console.error('Get categories error:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/events/:id
     */
    async getById(req, res) {
        try {
            const { id } = req.params;

            // Try by ID first, then by slug
            let event = await Event.findById(id);
            if (!event) {
                event = await Event.findBySlug(id);
            }

            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            res.status(200).json({
                success: true,
                data: { event }
            });
        } catch (error) {
            console.error('Get event error:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/events/:id/seats
     */
    async getSeats(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.query;

            // Verify event exists
            const event = await Event.findById(id);
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            const seats = await Seat.findByEventId(id, { status });

            // Group by section for easier frontend rendering
            const seatsBySection = {};
            for (const seat of seats) {
                if (!seatsBySection[seat.section]) {
                    seatsBySection[seat.section] = [];
                }
                seatsBySection[seat.section].push(seat);
            }

            res.status(200).json({
                success: true,
                data: {
                    eventId: id,
                    seats,
                    seatsBySection,
                    summary: {
                        total: seats.length,
                        available: seats.filter(s => s.status === 'available').length,
                        reserved: seats.filter(s => s.status === 'reserved').length,
                        booked: seats.filter(s => s.status === 'booked').length
                    }
                }
            });
        } catch (error) {
            console.error('Get seats error:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * POST /api/events (Admin only)
     */
    async create(req, res) {
        try {
            const eventData = req.body;
            eventData.organizerId = req.user.userId;

            const event = await Event.create(eventData);

            res.status(201).json({
                success: true,
                data: { event }
            });
        } catch (error) {
            console.error('Create event error:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * PUT /api/events/:id (Admin only)
     */
    async update(req, res) {
        try {
            const { id } = req.params;

            const event = await Event.update(id, req.body);
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            res.status(200).json({
                success: true,
                data: { event }
            });
        } catch (error) {
            console.error('Update event error:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * POST /api/events/:id/seats (Admin only)
     */
    async createSeats(req, res) {
        try {
            const { id } = req.params;
            const { seats } = req.body;

            // Verify event exists
            const event = await Event.findById(id);
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            const createdSeats = await Seat.createBulk(id, seats);
            await Event.updateAvailableSeats(id);

            res.status(201).json({
                success: true,
                data: { seats: createdSeats }
            });
        } catch (error) {
            console.error('Create seats error:', error.message);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = EventController;
