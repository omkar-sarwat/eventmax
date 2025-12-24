// EventMax Booking Context
// Global booking/cart state management with Redis-based reservation flow

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import bookingService from '../services/bookingService';

const BookingContext = createContext(null);

// Default reservation timeout (10 minutes - matches Redis TTL)
const DEFAULT_RESERVATION_TIMEOUT = 10 * 60 * 1000;

export function BookingProvider({ children }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [reservation, setReservation] = useState(null);
  const [reservationExpiry, setReservationExpiry] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Ref to track if component is mounted
  const isMounted = useRef(true);

  // Update timeRemaining every second when there's a reservation
  useEffect(() => {
    if (!reservationExpiry) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, reservationExpiry - Date.now());
      setTimeRemaining(Math.floor(remaining / 1000));
    };

    // Update immediately
    updateTimer();

    // Then update every second
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [reservationExpiry]);

  // Clear booking state
  const clearBooking = useCallback(() => {
    setSelectedEvent(null);
    setSelectedSeats([]);
    setReservation(null);
    setReservationExpiry(null);
    setError(null);
  }, []);

  // Select an event for booking
  const selectEvent = useCallback((event) => {
    // Clear previous booking state when selecting new event
    setSelectedSeats([]);
    setReservation(null);
    setReservationExpiry(null);
    setError(null);
    setSelectedEvent(event);
  }, []);

  // Toggle seat selection
  const toggleSeat = useCallback((seat) => {
    setSelectedSeats(prev => {
      const isSelected = prev.some(s => s.id === seat.id);
      if (isSelected) {
        return prev.filter(s => s.id !== seat.id);
      }
      // Max 10 seats per booking
      if (prev.length >= 10) {
        return prev;
      }
      return [...prev, seat];
    });
  }, []);

  // Select multiple seats at once
  const selectSeats = useCallback((seats) => {
    setSelectedSeats(seats.slice(0, 10)); // Max 10 seats
  }, []);

  // Clear seat selection
  const clearSeats = useCallback(() => {
    setSelectedSeats([]);
  }, []);

  // Check if a seat is selected
  const isSeatSelected = useCallback((seatId) => {
    return selectedSeats.some(s => s.id === seatId);
  }, [selectedSeats]);

  // Calculate total price
  const getTotalPrice = useCallback(() => {
    return selectedSeats.reduce((total, seat) => total + (seat.price || 0), 0);
  }, [selectedSeats]);

  /**
   * Reserve selected seats in Redis (10 minute hold)
   * Returns reservation with token for checkout
   */
  const reserveSeats = useCallback(async () => {
    if (!selectedEvent || selectedSeats.length === 0) {
      throw new Error('No seats selected');
    }

    setLoading(true);
    setError(null);

    try {
      const seatIds = selectedSeats.map(s => s.id);
      const result = await bookingService.reserveSeats(selectedEvent.id, seatIds);

      if (!isMounted.current) return result;

      setReservation({
        reservationToken: result.reservationToken,
        seats: result.seats || selectedSeats,
        eventId: result.eventId || selectedEvent.id,
        totalAmount: result.totalAmount || getTotalPrice(),
      });
      
      // Set expiry time from server response or default to 10 minutes
      const expiryTime = result.expiresAt 
        ? new Date(result.expiresAt).getTime()
        : Date.now() + (result.expiresIn ? result.expiresIn * 1000 : DEFAULT_RESERVATION_TIMEOUT);
      setReservationExpiry(expiryTime);

      return result;
    } catch (err) {
      if (isMounted.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [selectedEvent, selectedSeats, getTotalPrice]);

  /**
   * Verify reservation is still valid
   */
  const verifyReservation = useCallback(async () => {
    if (!reservation?.reservationToken) return { valid: false };

    try {
      const result = await bookingService.verifyReservation(reservation.reservationToken);
      
      if (!result.valid && isMounted.current) {
        // Reservation expired, clear state
        clearBooking();
      }
      
      return result;
    } catch (err) {
      console.warn('Failed to verify reservation:', err);
      return { valid: false };
    }
  }, [reservation, clearBooking]);

  /**
   * Confirm booking with customer data (finalizes in PostgreSQL)
   */
  const confirmBooking = useCallback(async (customerData, paymentData = {}) => {
    if (!reservation?.reservationToken) {
      throw new Error('No active reservation');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await bookingService.confirmBooking(
        reservation.reservationToken,
        customerData,
        { ...paymentData, amount: reservation.totalAmount || getTotalPrice() }
      );

      // Clear booking state after successful confirmation
      if (isMounted.current) {
        clearBooking();
      }

      return result;
    } catch (err) {
      if (isMounted.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [reservation, clearBooking, getTotalPrice]);

  /**
   * Cancel/release reservation (frees seats in Redis)
   */
  const cancelReservation = useCallback(async () => {
    if (!reservation?.reservationToken) return;

    try {
      await bookingService.cancelReservation(reservation.reservationToken);
    } catch (err) {
      console.warn('Failed to cancel reservation:', err);
    }

    if (isMounted.current) {
      clearBooking();
    }
  }, [reservation, clearBooking]);

  // Auto-release on timeout
  useEffect(() => {
    if (!reservationExpiry) return;

    const checkExpiry = () => {
      if (Date.now() >= reservationExpiry) {
        cancelReservation();
      }
    };

    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, [reservationExpiry, cancelReservation]);

  // Track mount state for async operations
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Clean up reservation on unmount
  useEffect(() => {
    return () => {
      if (reservation?.reservationToken) {
        bookingService.cancelReservation(reservation.reservationToken).catch(() => {});
      }
    };
  }, [reservation]);

  const value = {
    // State
    selectedEvent,
    selectedSeats,
    reservation,
    reservationToken: reservation?.reservationToken,
    loading,
    error,
    
    // Computed
    seatCount: selectedSeats.length,
    totalPrice: getTotalPrice(),
    timeRemaining: timeRemaining,
    hasReservation: !!reservation?.reservationToken,
    isExpired: reservationExpiry ? Date.now() >= reservationExpiry : false,
    
    // Actions
    selectEvent,
    toggleSeat,
    selectSeats,
    clearSeats,
    isSeatSelected,
    reserveSeats,
    verifyReservation,
    confirmBooking,
    cancelReservation,
    clearBooking,
    clearError: () => setError(null),
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}

export default BookingContext;
