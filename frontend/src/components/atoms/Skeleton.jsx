// EventMax Skeleton Component
// Loading placeholder with shimmer effect

import { cn } from '../../utils/cn';

function Skeleton({ className, variant = 'text', ...props }) {
  const variants = {
    text: 'h-4 w-full rounded',
    title: 'h-6 w-3/4 rounded',
    avatar: 'h-10 w-10 rounded-full',
    thumbnail: 'h-40 w-full rounded-xl',
    card: 'h-64 w-full rounded-2xl',
    button: 'h-12 w-32 rounded-xl',
  };

  return (
    <div
      className={cn(
        'bg-gray-200 animate-pulse',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

// Skeleton group for event cards
Skeleton.EventCard = function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card">
      <Skeleton variant="thumbnail" className="h-48" />
      <div className="p-4 space-y-3">
        <Skeleton variant="title" />
        <Skeleton variant="text" className="w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton variant="avatar" className="w-6 h-6" />
          <Skeleton variant="text" className="w-24" />
        </div>
        <Skeleton variant="text" className="w-20" />
      </div>
    </div>
  );
};

// Skeleton for event details page
Skeleton.EventDetails = function EventDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-80 w-full rounded-2xl" />
      <div className="space-y-4">
        <Skeleton variant="title" className="h-10" />
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" className="w-3/4" />
      </div>
    </div>
  );
};

// Skeleton for seat map
Skeleton.SeatMap = function SeatMapSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full rounded-xl mx-auto max-w-md" />
      <div className="grid grid-cols-10 gap-2">
        {Array.from({ length: 50 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-lg" />
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
