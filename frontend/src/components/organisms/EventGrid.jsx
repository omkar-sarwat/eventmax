// EventMax Event Grid Component
// Responsive grid of event cards

import { motion } from 'framer-motion';
import EventCard from '../molecules/EventCard';
import Skeleton from '../atoms/Skeleton';
import { cn } from '../../utils/cn';

function EventGrid({
  events = [],
  loading = false,
  skeletonCount = 6,
  columns = 3,
  className,
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  if (loading) {
    return (
      <div className={cn('grid gap-6', gridCols[columns], className)}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Skeleton.EventCard key={index} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">🎭</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No events found
        </h3>
        <p className="text-gray-500">
          Check back later for new events or try a different search.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={cn('grid gap-6', gridCols[columns], className)}
    >
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </motion.div>
  );
}

export default EventGrid;
