// EventMax Event Card Component
// Primary card for displaying events

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Star, Users, Heart } from 'lucide-react';
import { useState } from 'react';
import Badge from '../atoms/Badge';
import { cn } from '../../utils/cn';
import { formatDate, formatPrice, formatTime } from '../../utils/formatters';

function EventCard({ event, variant = 'default', className }) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);

  const {
    id,
    title,
    venue,
    category,
    date,
    startTime,
    minPrice,
    imageUrl,
    isFeatured,
    isSoldOut,
    rating,
    reviewCount,
    availableSeats,
    totalSeats,
  } = event;

  const availabilityPercent = totalSeats ? (availableSeats / totalSeats) * 100 : 100;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        'group bg-white rounded-2xl overflow-hidden shadow-card',
        'transition-shadow duration-300 hover:shadow-card-hover',
        className
      )}
    >
      <Link to={`/events/${id}`} className="block">
        {/* Image Section */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={imageError ? '/images/event-placeholder.jpg' : imageUrl}
            alt={title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {isFeatured && (
              <Badge variant="trending">🔥 Trending</Badge>
            )}
            {isSoldOut && (
              <Badge variant="error">Sold Out</Badge>
            )}
            {availabilityPercent < 20 && !isSoldOut && (
              <Badge variant="warning">Selling Fast</Badge>
            )}
          </div>
          
          {/* Like Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsLiked(!isLiked);
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
          >
            <Heart
              className={cn(
                'w-5 h-5 transition-colors',
                isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'
              )}
            />
          </button>
          
          {/* Category Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge variant="dark" className="backdrop-blur-sm">
              {category}
            </Badge>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          {/* Date & Time */}
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(date)}
            </span>
            {startTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatTime(startTime)}
              </span>
            )}
          </div>
          
          {/* Venue */}
          <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{venue}</span>
          </div>
          
          {/* Rating & Availability */}
          <div className="mt-3 flex items-center justify-between">
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
                {reviewCount > 0 && (
                  <span className="text-xs text-gray-400">({reviewCount})</span>
                )}
              </div>
            )}
            
            {availableSeats > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Users className="w-4 h-4" />
                <span>{availableSeats} seats left</span>
              </div>
            )}
          </div>
          
          {/* Price */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400">From</span>
              <p className="text-xl font-bold text-primary">
                {formatPrice(minPrice)}
              </p>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg"
            >
              Book Now
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export default EventCard;
