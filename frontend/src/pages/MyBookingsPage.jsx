// EventMax My Bookings Page
// View all user bookings

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Download,
  Eye,
  ChevronRight,
  Search,
  Filter,
  QrCode
} from 'lucide-react';
import Button from '../components/atoms/Button';
import Badge from '../components/atoms/Badge';
import Spinner from '../components/atoms/Spinner';
import Skeleton from '../components/atoms/Skeleton';
import bookingService from '../services/bookingService';
import { formatDate, formatTime, formatPrice } from '../utils/formatters';
import { cn } from '../utils/cn';

function MyBookingsPage() {
  const [filter, setFilter] = useState('all'); // all, upcoming, past
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Fetch user bookings
  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['userBookings'],
    queryFn: () => bookingService.getMyBookings(),
  });

  // Filter bookings
  const filteredBookings = bookings?.filter(booking => {
    const eventDate = booking.eventDate || booking.event_date;
    const isPast = eventDate ? new Date(eventDate) < new Date() : false;
    
    if (filter === 'upcoming' && isPast) return false;
    if (filter === 'past' && !isPast) return false;
    
    if (searchQuery) {
      const title = booking.eventTitle || booking.event_title || '';
      return title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return true;
  }) || [];

  const tabs = [
    { id: 'all', label: 'All Bookings' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-500">
              {filteredBookings.length} booking(s) found
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                'px-4 py-3 font-medium transition-colors relative',
                filter === tab.id
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
              {filter === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No bookings found
            </h2>
            <p className="text-gray-500 mb-6">
              {filter === 'all'
                ? "You haven't made any bookings yet"
                : `No ${filter} bookings`}
            </p>
            <Link to="/events">
              <Button variant="primary">
                Browse Events
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const isPast = new Date(booking.event_date) < new Date();
              
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Event Image */}
                    <div className="md:w-48 h-32 md:h-auto relative">
                      <img
                        src={booking.event_image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400'}
                        alt={booking.event_title}
                        className="w-full h-full object-cover"
                      />
                      {isPast && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="secondary">Past Event</Badge>
                        </div>
                      )}
                    </div>

                    {/* Booking Details */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={isPast ? 'secondary' : 'success'}>
                              {isPast ? 'Completed' : 'Confirmed'}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Booking #{booking.id?.slice(0, 8)}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.event_title || 'Event Title'}
                          </h3>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(booking.total_amount || 0)}
                        </p>
                      </div>

                      {/* Event Info */}
                      <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(booking.event_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(booking.event_time)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {booking.venue || 'Venue TBD'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Ticket className="w-4 h-4" />
                          {booking.seat_count || 1} ticket(s)
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-4 h-4" />}
                          onClick={() => setSelectedBooking(booking)}
                        >
                          View Details
                        </Button>
                        {!isPast && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Download className="w-4 h-4" />}
                          >
                            Download Ticket
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Booking Detail Modal */}
        <AnimatePresence>
          {selectedBooking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedBooking(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
                  <Badge variant="light" className="bg-white/20 text-white mb-4">
                    Booking #{selectedBooking.id?.slice(0, 8)}
                  </Badge>
                  <h2 className="text-xl font-bold">
                    {selectedBooking.event_title}
                  </h2>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Event Details */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{formatDate(selectedBooking.event_date)}</p>
                        <p className="text-sm text-gray-500">{formatTime(selectedBooking.event_time)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{selectedBooking.venue}</p>
                        <p className="text-sm text-gray-500">{selectedBooking.location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Seats */}
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">Your Seats</h3>
                    <div className="flex flex-wrap gap-2">
                      {(selectedBooking.seats || []).map((seat, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-100 rounded-lg px-3 py-2 text-sm"
                        >
                          Row {seat.row}, Seat {seat.number}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="bg-gray-50 rounded-xl p-6 text-center mb-6">
                    <QrCode className="w-24 h-24 mx-auto text-gray-800" />
                    <p className="text-sm text-gray-500 mt-2">
                      Show this at the venue
                    </p>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center py-4 border-t">
                    <span className="text-gray-600">Total Paid</span>
                    <span className="text-xl font-bold">
                      {formatPrice(selectedBooking.total_amount || 0)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      fullWidth
                      leftIcon={<Download className="w-5 h-5" />}
                    >
                      Download Ticket
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default MyBookingsPage;
