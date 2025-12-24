// EventMax Event Details Page
// Single event view with all details and booking option

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Share2,
  Heart,
  ChevronRight,
  Star,
  Ticket,
  Info,
  AlertCircle,
  Check
} from 'lucide-react';
import Button from '../components/atoms/Button';
import Badge from '../components/atoms/Badge';
import Spinner from '../components/atoms/Spinner';
import eventService from '../services/eventService';
import { formatDate, formatTime, formatPrice } from '../utils/formatters';
import { cn } from '../utils/cn';
import { animations } from '../styles/animations';

function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Fetch event details
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getEventById(id),
    retry: 1,
  });

  // Fetch similar events
  const { data: similarEvents } = useQuery({
    queryKey: ['events', 'similar', event?.category],
    queryFn: () => eventService.getEvents({ category: event?.category, limit: 4 }),
    enabled: !!event?.category,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/events')}>Browse Events</Button>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed');
      }
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareMenu(false);
  };

  const availabilityPercentage = event.available_seats
    ? Math.round((event.available_seats / event.total_seats) * 100)
    : 50;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <img
          src={event.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200'}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
        >
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={cn(
              'p-2 rounded-full transition-colors',
              isLiked ? 'bg-red-500 text-white' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
            )}
          >
            <Heart className={cn('w-6 h-6', isLiked && 'fill-current')} />
          </button>
          <div className="relative">
            <button
              onClick={handleShare}
              className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <Share2 className="w-6 h-6" />
            </button>
            <AnimatePresence>
              {showShareMenu && (
                <motion.div
                  {...animations.modal}
                  className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg p-2 min-w-[150px]"
                >
                  <button
                    onClick={copyLink}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    Copy Link
                  </button>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(event.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    Share on Twitter
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Event Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="container-custom">
            <Badge variant="primary" className="mb-4">
              {event.category || 'Event'}
            </Badge>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-bold text-white mb-4"
            >
              {event.title}
            </motion.h1>
            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{formatTime(event.time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{event.venue || 'Venue TBD'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">About this event</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {event.description || 'No description available.'}
              </p>
            </motion.section>

            {/* Venue */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Venue</h2>
              <div className="flex items-start gap-4">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{event.venue || 'Venue'}</h3>
                  <p className="text-gray-600">{event.location || 'Location details will be provided'}</p>
                </div>
              </div>
              {/* Map placeholder */}
              <div className="mt-4 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Map view coming soon</span>
              </div>
            </motion.section>

            {/* Important Info */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Important Information</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-600">E-tickets will be sent to your registered email</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-600">Please carry a valid ID proof</span>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                  <span className="text-gray-600">Gates open 1 hour before the event</span>
                </div>
              </div>
            </motion.section>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-lg sticky top-24"
            >
              {/* Price */}
              <div className="text-center mb-6 pb-6 border-b border-gray-100">
                <p className="text-sm text-gray-500 mb-2">Starting from</p>
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(event.price || event.basePrice || 0)}
                </span>
              </div>

              {/* Availability */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Availability</span>
                  <span className="text-sm font-medium text-gray-900">
                    {event.available_seats || 'Limited'} seats left
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${availabilityPercentage}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={cn(
                      'h-full rounded-full',
                      availabilityPercentage > 50 ? 'bg-green-500' :
                      availabilityPercentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                  />
                </div>
                {availabilityPercentage < 30 && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Selling fast! Only few seats left
                  </p>
                )}
              </div>

              {/* Date Selection */}
              {event.dates && event.dates.length > 1 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {event.dates.map((date, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          'p-3 rounded-lg border text-center transition-colors',
                          selectedDate === date
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <p className="text-sm font-medium">{formatDate(date)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Book Button */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<Ticket className="w-5 h-5" />}
                onClick={() => navigate(`/events/${id}/seats`)}
                disabled={event.available_seats === 0}
              >
                {event.available_seats === 0 ? 'Sold Out' : 'Select Seats'}
              </Button>

              {/* Info */}
              <p className="text-xs text-center text-gray-500 mt-4">
                By proceeding, you agree to our Terms of Service
              </p>
            </motion.div>
          </div>
        </div>

        {/* Similar Events */}
        {similarEvents?.events?.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">You might also like</h2>
              <Link
                to={`/events?category=${event.category}`}
                className="text-primary hover:underline font-medium"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarEvents.events.filter(e => e.id !== event.id).slice(0, 4).map((similarEvent) => (
                <Link
                  key={similarEvent.id}
                  to={`/events/${similarEvent.id}`}
                  className="card hover-lift overflow-hidden group"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={similarEvent.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400'}
                      alt={similarEvent.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {similarEvent.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(similarEvent.date)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}

export default EventDetailsPage;
