// EventMax Event Service
// Handles all event-related API calls

import api from './api';

// Helper to safely extract primitive values
const safeString = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') {
    return value.name || value.title || value.label || JSON.stringify(value);
  }
  return String(value);
};

const safeNumber = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

// Transform event data to ensure all values are primitives
const transformEvent = (event) => {
  if (!event) return null;
  
  // Handle nested venue object
  const venueName = event.venueName || event.venue_name || (event.venue?.name) || event.venue || 'Venue TBA';
  const venueCity = event.venueCity || event.venue_city || (event.venue?.city) || '';
  const venueAddress = event.venueAddress || event.venue_address || (event.venue?.address) || '';
  
  // Handle nested category object  
  const categoryName = event.categoryName || (event.category?.name) || (typeof event.category === 'string' ? event.category : 'Event');
  const categoryId = event.categoryId || event.category_id || (event.category?.id);
  
  // Handle nested organizer object
  const organizerName = event.organizerName || (event.organizer?.name) || (typeof event.organizer === 'string' ? event.organizer : 'EventMax');
  const organizerId = event.organizerId || event.organizer_id || (event.organizer?.id);
  
  // Handle date - API returns eventDate
  const eventDate = event.eventDate || event.event_date || event.date;
  
  // Handle pricing - API returns basePrice  
  const basePrice = safeNumber(event.basePrice || event.base_price || event.minPrice || event.min_price || event.price, 0);
  const maxPrice = safeNumber(event.maxPrice || event.max_price, basePrice);
  
  // Handle image - API returns posterImageUrl
  const imageUrl = safeString(
    event.posterImageUrl || event.poster_image_url || event.imageUrl || event.image_url || event.image,
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'
  );
  
  return {
    id: event.id,
    title: safeString(event.title, 'Untitled Event'),
    slug: safeString(event.slug, ''),
    description: safeString(event.description, ''),
    shortDescription: safeString(event.shortDescription || event.short_description, ''),
    
    // Venue - extract string value
    venue: safeString(venueName, 'Venue TBA'),
    venueName: safeString(venueName, 'Venue TBA'),
    venueAddress: safeString(venueAddress, ''),
    venueCity: safeString(venueCity, ''),
    location: safeString(venueCity || event.location, ''),
    
    // Category - extract string value
    category: safeString(categoryName, 'Event'),
    categoryId: categoryId,
    
    // Organizer - extract string value
    organizer: safeString(organizerName, 'EventMax'),
    organizerId: organizerId,
    
    // Date/Time - use eventDate from API
    date: eventDate,
    eventDate: eventDate,
    time: event.start_time || event.event_time || event.time,
    startTime: event.doorsOpenTime || event.doors_open_time || event.startTime || event.start_time,
    endTime: event.eventEndTime || event.event_end_time || event.endTime || event.end_time,
    
    // Pricing - use basePrice from API
    minPrice: basePrice,
    maxPrice: maxPrice,
    price: basePrice,
    basePrice: basePrice,
    currency: safeString(event.currency, 'USD'),
    
    // Media
    image: imageUrl,
    imageUrl: imageUrl,
    posterImageUrl: imageUrl,
    thumbnailUrl: safeString(event.thumbnail_url || event.thumbnailUrl, imageUrl),
    
    // Capacity
    total_seats: safeNumber(event.totalSeats || event.total_seats || event.capacity, 100),
    available_seats: safeNumber(event.availableSeats || event.available_seats, 100),
    totalSeats: safeNumber(event.totalSeats || event.total_seats || event.capacity, 100),
    availableSeats: safeNumber(event.availableSeats || event.available_seats, 100),
    maxSeatsPerBooking: safeNumber(event.maxSeatsPerBooking || event.max_seats_per_booking, 10),
    
    // Status
    status: safeString(event.status, 'published'),
    isFeatured: Boolean(event.isFeatured || event.is_featured),
    isSoldOut: Boolean(event.isSoldOut || event.is_sold_out || event.availableSeats === 0),
    
    // Rating
    rating: safeNumber(event.rating, 0),
    reviewCount: safeNumber(event.review_count || event.reviewCount, 0),
    
    // Timestamps
    createdAt: event.createdAt || event.created_at,
    updatedAt: event.updatedAt || event.updated_at,
  };
};

// Transform seat data - matches backend Seat.format()
const transformSeat = (seat) => {
  const price = parseFloat(seat.price || seat.currentPrice || seat.current_price || seat.basePrice || seat.base_price) || 0;
  return {
    id: seat.id,
    row: seat.rowLabel || seat.row || seat.row_identifier || 'A',
    row_number: seat.rowLabel || seat.row || seat.row_identifier || 'A',
    rowLabel: seat.rowLabel || seat.row || seat.row_identifier || 'A',
    number: parseInt(seat.seatNumber || seat.number || seat.seat_number, 10) || 1,
    seat_number: parseInt(seat.seatNumber || seat.number || seat.seat_number, 10) || 1,
    seatNumber: parseInt(seat.seatNumber || seat.number || seat.seat_number, 10) || 1,
    label: seat.seatLabel || seat.label || seat.seat_label || '',
    seatLabel: seat.seatLabel || seat.label || seat.seat_label || '',
    section: seat.section || 'General',
    category: seat.seatType || seat.type || seat.category || 'Standard',
    type: seat.seatType || seat.type || 'standard',
    seatType: seat.seatType || seat.type || 'standard',
    price: price,
    basePrice: parseFloat(seat.basePrice || seat.base_price) || price,
    currentPrice: price,
    status: seat.status || 'available',
    eventId: seat.eventId || seat.event_id,
  };
};

const eventService = {
  // Get all events with optional filters
  // Backend: GET /api/events
  async getEvents(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    if (params.featured) queryParams.append('featured', 'true');
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    
    const query = queryParams.toString();
    const endpoint = query ? `/events?${query}` : '/events';
    
    const response = await api.get(endpoint);
    
    if (response.success && response.data) {
      const events = Array.isArray(response.data) ? response.data : response.data.events || [];
      return {
        events: events.map(transformEvent),
        total: response.data.total || events.length,
        page: response.data.page || 1,
        limit: response.data.limit || events.length,
      };
    }
    
    return { events: [], total: 0, page: 1, limit: 10 };
  },

  // Get featured events
  // Backend: GET /api/events/featured
  async getFeaturedEvents() {
    const response = await api.get('/events/featured');
    
    if (response.success && response.data) {
      const events = Array.isArray(response.data) ? response.data : response.data.events || [];
      return events.map(transformEvent);
    }
    
    return [];
  },

  // Get upcoming events
  // Backend: GET /api/events/upcoming
  async getUpcomingEvents(limit = 6) {
    const response = await api.get(`/events/upcoming?limit=${limit}`);
    
    if (response.success && response.data) {
      const events = Array.isArray(response.data) ? response.data : response.data.events || [];
      return events.map(transformEvent);
    }
    
    return [];
  },

  // Get single event by ID
  // Backend: GET /api/events/:id
  async getEventById(eventId) {
    const response = await api.get(`/events/${eventId}`);
    
    if (response.success && response.data) {
      // Backend returns { data: { event: {...} } }
      const event = response.data.event || response.data;
      return transformEvent(event);
    }
    
    throw new Error(response.error || 'Event not found');
  },

  // Get event seats/seating layout
  // Backend: GET /api/events/:id/seats
  async getSeats(eventId) {
    const response = await api.get(`/events/${eventId}/seats`);
    
    if (response.success && response.data) {
      const data = response.data;
      
      // Extract seats from response
      let seats = [];
      if (Array.isArray(data)) {
        seats = data.map(transformSeat);
      } else if (Array.isArray(data.seats)) {
        seats = data.seats.map(transformSeat);
      } else if (data.seatsBySection) {
        // Flatten seats from sections
        Object.values(data.seatsBySection).forEach(sectionSeats => {
          seats.push(...sectionSeats.map(transformSeat));
        });
      }
      
      // Get price categories
      const priceCategories = [];
      const priceMap = new Map();
      seats.forEach(seat => {
        const cat = seat.category || seat.type || 'Standard';
        if (!priceMap.has(cat)) {
          priceMap.set(cat, seat.price);
          priceCategories.push({ name: cat, price: seat.price });
        }
      });
      
      // Group by section
      const sections = {};
      seats.forEach(seat => {
        const section = seat.section || 'General';
        if (!sections[section]) {
          sections[section] = {
            name: section,
            seats: [],
            price: seat.price,
          };
        }
        sections[section].seats.push(seat);
      });
      
      return {
        eventId,
        seats,
        sections: Object.values(sections),
        priceCategories,
        summary: data.summary || {
          total: seats.length,
          available: seats.filter(s => s.status === 'available').length,
          reserved: seats.filter(s => s.status === 'reserved').length,
          sold: seats.filter(s => s.status === 'sold').length,
        },
      };
    }
    
    throw new Error(response.error || 'Failed to load seats');
  },

  // Alias for getSeats
  async getEventSeats(eventId) {
    return this.getSeats(eventId);
  },

  // Search events
  // Backend: GET /api/events?search=query
  async searchEvents(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('search', params.query);
    if (params.category) queryParams.append('category', params.category);
    if (params.location) queryParams.append('location', params.location);
    if (params.date) queryParams.append('date', params.date);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    
    const query = queryParams.toString();
    const response = await api.get(`/events?${query}`);
    
    if (response.success && response.data) {
      const events = Array.isArray(response.data) ? response.data : response.data.events || [];
      return {
        events: events.map(transformEvent),
        total: response.data.total || events.length,
      };
    }
    
    return { events: [], total: 0 };
  },

  // Get events by category
  // Backend: GET /api/events?category=:categoryId
  async getEventsByCategory(categoryId) {
    return this.getEvents({ category: categoryId });
  },

  // Get categories
  // Backend: GET /api/events/categories
  async getCategories() {
    // Category-specific icons mapping
    const categoryIcons = {
      'concerts': '🎵',
      'theater': '🎭',
      'sports': '⚽',
      'conferences': '🎤',
      'comedy': '😂',
      'festivals': '🎪',
      'dance': '💃',
      'family': '👨‍👩‍👧‍👦',
      'music': '🎶',
      'art': '🎨',
      'food': '🍕',
      'nightlife': '🌙',
      'wellness': '🧘',
      'education': '📚',
      'networking': '🤝',
      'gaming': '🎮',
      'film': '🎬',
      'charity': '❤️',
      'outdoor': '🏕️',
      'technology': '💻',
    };

    const getIconForCategory = (name) => {
      if (!name) return '🎟️';
      const normalized = name.toLowerCase().trim();
      return categoryIcons[normalized] || '🎟️';
    };

    try {
      const response = await api.get('/events/categories');
      
      if (response.success && response.data) {
        const categories = Array.isArray(response.data) ? response.data : response.data.categories || [];
        return categories.map(cat => ({
          id: cat.id,
          name: safeString(cat.name, 'Category'),
          slug: safeString(cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-'), ''),
          icon: safeString(cat.icon, getIconForCategory(cat.name)),
          count: safeNumber(cat.event_count || cat.eventCount, 0),
          description: safeString(cat.description, ''),
        }));
      }
    } catch (error) {
      console.warn('Categories API not available, using defaults');
    }
    
    // Default categories if API fails
    return [
      { id: 1, name: 'Concerts', icon: '🎵', count: 0 },
      { id: 2, name: 'Sports', icon: '⚽', count: 0 },
      { id: 3, name: 'Theater', icon: '🎭', count: 0 },
      { id: 4, name: 'Comedy', icon: '😂', count: 0 },
      { id: 5, name: 'Conferences', icon: '🎤', count: 0 },
      { id: 6, name: 'Festivals', icon: '🎪', count: 0 },
    ];
  },

  // Get platform stats
  // Backend: GET /api/stats
  async getStats() {
    try {
      const response = await api.get('/stats');
      if (response.success && response.data) {
        return {
          totalEvents: safeNumber(response.data.total_events || response.data.totalEvents, 0),
          totalBookings: safeNumber(response.data.total_bookings || response.data.totalBookings, 0),
          totalUsers: safeNumber(response.data.total_users || response.data.totalUsers, 0),
          totalVenues: safeNumber(response.data.total_venues || response.data.totalVenues, 0),
          upcomingEvents: safeNumber(response.data.upcoming_events || response.data.upcomingEvents, 0),
          activeEvents: safeNumber(response.data.active_events || response.data.activeEvents, 0),
          totalRevenue: safeNumber(response.data.total_revenue || response.data.totalRevenue, 0),
        };
      }
    } catch (error) {
      console.warn('Stats API error:', error);
    }
    
    return {
      totalEvents: 0,
      totalUsers: 0,
      totalBookings: 0,
      totalVenues: 0,
      upcomingEvents: 0,
    };
  },
};

export default eventService;
export { transformEvent, transformSeat, safeString, safeNumber };
