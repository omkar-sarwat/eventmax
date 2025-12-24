// EventMax Seat Button Component
// Individual seat in the seat map

import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const statusStyles = {
  available: 'bg-green-500 text-white hover:bg-green-600 hover:scale-110 cursor-pointer',
  selected: 'bg-blue-500 text-white ring-2 ring-blue-300 scale-110',
  reserved: 'bg-yellow-500 text-white cursor-not-allowed opacity-70',
  booked: 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50',
  sold: 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50',
  vip: 'bg-purple-500 text-white hover:bg-purple-600 hover:scale-110 cursor-pointer',
  premium: 'bg-pink-500 text-white hover:bg-pink-600 hover:scale-110 cursor-pointer',
  wheelchair: 'bg-cyan-500 text-white hover:bg-cyan-600 hover:scale-110 cursor-pointer',
};

const sizeStyles = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

function SeatButton({
  seat,
  isSelected = false,
  onClick,
  size = 'md',
  showLabel = true,
  className,
}) {
  const { id, row, number, label, status, type, price } = seat;
  
  // Determine the actual status for styling
  // Priority: selected > vip type > actual status
  const effectiveStatus = isSelected 
    ? 'selected' 
    : (status === 'available' && type === 'vip') 
      ? 'vip' 
      : status;
  
  // Seat is disabled if: sold, booked, or reserved by someone else
  const isDisabled = status === 'sold' || status === 'booked' || status === 'reserved';
  
  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick(seat);
    }
  };

  // Format status display for tooltip
  const statusDisplay = status === 'booked' ? 'Sold' : status;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.1 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      onClick={handleClick}
      disabled={isDisabled}
      title={`${label || `${row}${number}`} - $${price} - ${statusDisplay}`}
      className={cn(
        'rounded-lg flex items-center justify-center font-medium transition-all duration-200',
        sizeStyles[size],
        statusStyles[effectiveStatus] || statusStyles.available,
        className
      )}
    >
      {showLabel && (label || number)}
    </motion.button>
  );
}

// Seat Legend Component with explicit colors
const legendColors = {
  available: 'bg-green-500',
  selected: 'bg-blue-500',
  vip: 'bg-purple-500',
  reserved: 'bg-yellow-500',
  sold: 'bg-gray-400',
  booked: 'bg-gray-400',
  premium: 'bg-pink-500',
};

SeatButton.Legend = function SeatLegend({ className }) {
  const legendItems = [
    { status: 'available', label: 'Available' },
    { status: 'selected', label: 'Selected' },
    { status: 'vip', label: 'VIP' },
    { status: 'reserved', label: 'Reserved' },
    { status: 'sold', label: 'Sold' },
  ];

  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      {legendItems.map(({ status, label }) => (
        <div key={status} className="flex items-center gap-2">
          <div className={cn('w-5 h-5 rounded', legendColors[status])} />
          <span className="text-sm text-gray-600">{label}</span>
        </div>
      ))}
    </div>
  );
};

export default SeatButton;
