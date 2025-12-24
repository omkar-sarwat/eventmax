/**
 * Socket.IO WebSocket Handler
 * 
 * Manages real-time communication for seat availability updates,
 * booking confirmations, and event notifications.
 * 
 * Namespace Strategy:
 *   - /events/:eventId - Room for specific event updates
 *   - /admin - Admin-only notifications
 * 
 * Events:
 *   - seat_reserved: {eventId, seatLabel, reservedBy, expiresAt}
 *   - seat_released: {eventId, seatLabel}
 *   - booking_confirmed: {eventId, seatLabel, bookingId}
 *   - event_updated: {eventId, changes}
 */

const { Server } = require('socket.io');

let io = null;

/**
 * Attach Socket.IO to HTTP server
 * @param {http.Server} server - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
function attachSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.CORS_ORIGINS?.split(',')
        : '*',
      methods: ['GET', 'POST']
    },
    // Connection settings
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Main namespace for general connections
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    // Send welcome message for validation
    socket.emit('connected', {
      message: 'Connected to EventMax WebSocket',
      timestamp: new Date().toISOString(),
      socketId: socket.id
    });

    // Handle joining event rooms
    socket.on('join_event', (eventId) => {
      if (!eventId) return;
      
      socket.join(`event_${eventId}`);
      console.log(`🏠 Socket ${socket.id} joined event_${eventId}`);
      
      socket.emit('joined_event', { eventId });
    });

    // Handle leaving event rooms
    socket.on('leave_event', (eventId) => {
      if (!eventId) return;
      
      socket.leave(`event_${eventId}`);
      console.log(`🚪 Socket ${socket.id} left event_${eventId}`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`📡 Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`🔴 Socket error for ${socket.id}:`, error);
    });
  });

  // Admin namespace for administrative notifications
  const adminNamespace = io.of('/admin');
  adminNamespace.on('connection', (socket) => {
    console.log(`👑 Admin connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
      console.log(`👑 Admin disconnected: ${socket.id}`);
    });
  });

  console.log('🚀 Socket.IO server initialized');
  return io;
}

/**
 * Get Socket.IO instance
 * @returns {Server|null} Socket.IO server instance
 */
function getIO() {
  return io;
}

/**
 * Broadcast seat reservation to event room
 * @param {string} eventId - Event ID
 * @param {Object} reservationData - Reservation details
 */
function broadcastSeatReserved(eventId, reservationData) {
  if (!io) return;
  
  io.to(`event_${eventId}`).emit('seat_reserved', {
    eventId,
    ...reservationData,
    timestamp: new Date().toISOString()
  });
}

/**
 * Broadcast seat release to event room
 * @param {string} eventId - Event ID
 * @param {string} seatLabel - Seat label
 */
function broadcastSeatReleased(eventId, seatLabel) {
  if (!io) return;
  
  io.to(`event_${eventId}`).emit('seat_released', {
    eventId,
    seatLabel,
    timestamp: new Date().toISOString()
  });
}

/**
 * Broadcast booking confirmation to event room
 * @param {string} eventId - Event ID
 * @param {Object} bookingData - Booking details
 */
function broadcastBookingConfirmed(eventId, bookingData) {
  if (!io) return;
  
  io.to(`event_${eventId}`).emit('booking_confirmed', {
    eventId,
    ...bookingData,
    timestamp: new Date().toISOString()
  });
}

/**
 * Send admin notification
 * @param {Object} notification - Admin notification data
 */
function sendAdminNotification(notification) {
  if (!io) return;
  
  io.of('/admin').emit('notification', {
    ...notification,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  attachSocket,
  getIO,
  broadcastSeatReserved,
  broadcastSeatReleased,
  broadcastBookingConfirmed,
  sendAdminNotification
};
