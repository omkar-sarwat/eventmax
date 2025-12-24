// EventMax Booking Service
// Handles all booking-related API calls with Redis-based reservation flow

import api from './api';

/**
 * Booking Flow with Redis:
 * 1. reserveSeats() - Creates temporary 10-minute hold in Redis
 * 2. verifyReservation() - Checks if reservation is still valid
 * 3. confirmBooking() - Finalizes booking in PostgreSQL after payment
 * 4. cancelReservation() - Releases seats back to available
 */

const bookingService = {
  /**
   * Reserve seats (temporary hold in Redis)
   * Backend: POST /api/bookings/reserve
   * 
   * @param {number} eventId - Event ID
   * @param {number[]} seatIds - Array of seat IDs to reserve
   * @returns {Object} Reservation data with token
   */
  async reserveSeats(eventId, seatIds) {
    const response = await api.post('/bookings/reserve', {
      eventId,
      seatIds,
    });

    if (response.success && response.data) {
      return {
        reservationToken: response.data.reservationToken || response.data.reservation_token,
        seats: response.data.seats || [],
        eventId: response.data.eventId || response.data.event_id || eventId,
        expiresAt: response.data.expiresAt || response.data.expires_at,
        expiresIn: response.data.expiresIn || response.data.expires_in || 600, // 10 minutes default
        totalAmount: response.data.totalAmount || response.data.total_amount || 0,
      };
    }

    throw new Error(response.error || 'Failed to reserve seats');
  },

  /**
   * Verify reservation is still valid
   * Backend: GET /api/bookings/verify/:token
   * 
   * @param {string} reservationToken - Token returned from reserveSeats
   * @returns {Object} Reservation validity and remaining time
   */
  async verifyReservation(reservationToken) {
    const response = await api.get(`/bookings/verify/${reservationToken}`);

    if (response.success && response.data) {
      return {
        valid: response.data.valid !== false,
        reservationToken: response.data.reservationToken || reservationToken,
        seats: response.data.seats || [],
        eventId: response.data.eventId || response.data.event_id,
        expiresAt: response.data.expiresAt || response.data.expires_at,
        remainingTime: response.data.remainingTime || response.data.remaining_time,
        totalAmount: response.data.totalAmount || response.data.total_amount,
      };
    }

    return { valid: false, reservationToken };
  },

  /**
   * Confirm booking (finalize in PostgreSQL after payment)
   * Backend: POST /api/bookings/confirm
   * 
   * @param {string} reservationToken - Token from reserveSeats
   * @param {Object} customerData - Customer information
   * @param {Object} paymentData - Payment information
   * @returns {Object} Confirmed booking data
   */
  async confirmBooking(reservationToken, customerData, paymentData = {}) {
    const response = await api.post('/bookings/confirm', {
      reservationToken,
      // Backend expects 'customer' not 'customerData'
      customer: {
        email: customerData.email,
        firstName: customerData.firstName || customerData.first_name,
        lastName: customerData.lastName || customerData.last_name,
        phone: customerData.phone || '',
      },
      // Backend expects 'payment' not 'paymentData'
      payment: {
        method: paymentData.method || 'card',
        transactionId: paymentData.transactionId || `txn_${Date.now()}`,
        amount: paymentData.amount,
      },
    });

    console.log('confirmBooking response:', response);

    if (response.success && response.data) {
      // The backend returns { booking, invoice, seats }
      const { booking, invoice, seats } = response.data;
      
      return {
        // Pass through the complete booking object from backend
        ...booking,
        bookingId: booking?.id || response.data.bookingId || response.data.booking_id,
        confirmationNumber: booking?.bookingReference || response.data.confirmationNumber,
        status: booking?.status || response.data.status || 'confirmed',
        tickets: seats || booking?.seats || response.data.tickets || [],
        totalAmount: booking?.totalAmount || response.data.totalAmount || response.data.total_amount,
        event: booking?.event || response.data.event,
        customer: booking?.customer || response.data.customer,
        invoice: invoice,
      };
    }

    throw new Error(response.error || 'Failed to confirm booking');
  },

  /**
   * Cancel/release reservation (free seats in Redis)
   * Backend: DELETE /api/bookings/reserve/:token
   * 
   * @param {string} reservationToken - Token to cancel
   * @returns {boolean} Success status
   */
  async cancelReservation(reservationToken) {
    const response = await api.delete(`/bookings/reserve/${reservationToken}`);
    return response.success;
  },

  /**
   * Get user's bookings
   * Backend: GET /api/bookings
   * 
   * @returns {Array} List of user's bookings
   */
  async getMyBookings() {
    const response = await api.get('/bookings');

    if (response.success && response.data) {
      const bookings = Array.isArray(response.data) ? response.data : response.data.bookings || [];
      return bookings.map(booking => ({
        id: booking.id,
        confirmationNumber: booking.confirmation_number || booking.confirmationNumber,
        eventId: booking.event_id || booking.eventId,
        eventTitle: booking.event?.title || booking.event_title || 'Event',
        eventDate: booking.event?.date || booking.event_date || booking.event?.event_date,
        eventImage: booking.event?.image_url || booking.event?.imageUrl,
        venue: booking.event?.venue_name || booking.event?.venue?.name || booking.venue || 'Venue TBA',
        seats: booking.seats || booking.tickets || [],
        seatCount: booking.seat_count || booking.seatCount || (booking.seats?.length || 0),
        totalAmount: booking.total_amount || booking.totalAmount,
        status: booking.status,
        paymentStatus: booking.payment_status || booking.paymentStatus || 'completed',
        createdAt: booking.created_at || booking.createdAt,
      }));
    }

    return [];
  },

  /**
   * Get booking by ID
   * Backend: GET /api/bookings/:id
   * 
   * @param {number} bookingId - Booking ID
   * @returns {Object} Booking details
   */
  async getBookingById(bookingId) {
    const response = await api.get(`/bookings/${bookingId}`);

    if (response.success && response.data) {
      const booking = response.data;
      return {
        id: booking.id,
        confirmationNumber: booking.confirmation_number || booking.confirmationNumber,
        eventId: booking.event_id || booking.eventId,
        event: booking.event ? {
          id: booking.event.id,
          title: booking.event.title,
          date: booking.event.event_date || booking.event.date,
          time: booking.event.start_time || booking.event.time,
          venue: booking.event.venue_name || booking.event.venue?.name,
          venueAddress: booking.event.venue_address || booking.event.venue?.address,
          imageUrl: booking.event.image_url || booking.event.imageUrl,
        } : null,
        seats: booking.seats || booking.tickets || [],
        seatCount: booking.seat_count || booking.seatCount || (booking.seats?.length || 0),
        totalAmount: booking.total_amount || booking.totalAmount,
        status: booking.status,
        paymentStatus: booking.payment_status || booking.paymentStatus,
        paymentMethod: booking.payment_method || booking.paymentMethod,
        createdAt: booking.created_at || booking.createdAt,
        customer: booking.customer || {
          email: booking.customer_email || booking.email,
          firstName: booking.customer_first_name || booking.firstName,
          lastName: booking.customer_last_name || booking.lastName,
          phone: booking.customer_phone || booking.phone,
        },
      };
    }

    throw new Error(response.error || 'Booking not found');
  },

  /**
   * Cancel a confirmed booking (request refund)
   * Backend: DELETE /api/bookings/:id (or POST /api/bookings/:id/cancel)
   * 
   * @param {number} bookingId - Booking ID to cancel
   * @returns {boolean} Success status
   */
  async cancelBooking(bookingId) {
    const response = await api.delete(`/bookings/${bookingId}`);

    if (response.success) {
      return true;
    }

    throw new Error(response.error || 'Failed to cancel booking');
  },

  /**
   * Get booking statistics for user dashboard
   * Backend: GET /api/bookings/stats (if available)
   * 
   * @returns {Object} Booking statistics
   */
  async getBookingStats() {
    try {
      // Try to get stats from dedicated endpoint
      const response = await api.get('/bookings/stats');
      if (response.success && response.data) {
        return {
          totalBookings: response.data.total_bookings || response.data.totalBookings || 0,
          upcomingEvents: response.data.upcoming_events || response.data.upcomingEvents || 0,
          totalSpent: response.data.total_spent || response.data.totalSpent || 0,
          completedBookings: response.data.completed_bookings || response.data.completedBookings || 0,
        };
      }
    } catch (error) {
      // If stats endpoint doesn't exist, calculate from bookings
      try {
        const bookings = await this.getMyBookings();
        const now = new Date();
        return {
          totalBookings: bookings.length,
          upcomingEvents: bookings.filter(b => new Date(b.eventDate) > now).length,
          totalSpent: bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
          completedBookings: bookings.filter(b => b.status === 'confirmed').length,
        };
      } catch {
        console.warn('Could not fetch booking stats');
      }
    }

    return {
      totalBookings: 0,
      upcomingEvents: 0,
      totalSpent: 0,
      completedBookings: 0,
    };
  },
};

export default bookingService;
