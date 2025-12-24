// EventMax Price Display Component
// Price breakdown with fees

import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { formatPrice } from '../../utils/formatters';

function PriceDisplay({
  items = [],
  subtotal,
  fees = 0,
  taxes = 0,
  total,
  showBreakdown = true,
  className,
}) {
  const calculatedSubtotal = subtotal ?? items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const calculatedTotal = total ?? (calculatedSubtotal + fees + taxes);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Items */}
      {showBreakdown && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.name}
                {item.quantity > 1 && <span className="text-gray-400"> × {item.quantity}</span>}
              </span>
              <span className="font-medium text-gray-900">
                {formatPrice(item.price * (item.quantity || 1))}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Subtotal */}
      {showBreakdown && (fees > 0 || taxes > 0) && (
        <>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">
                {formatPrice(calculatedSubtotal)}
              </span>
            </div>
          </div>

          {/* Fees */}
          {fees > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service Fee</span>
              <span className="text-gray-700">{formatPrice(fees)}</span>
            </div>
          )}

          {/* Taxes */}
          {taxes > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Taxes</span>
              <span className="text-gray-700">{formatPrice(taxes)}</span>
            </div>
          )}
        </>
      )}

      {/* Total */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border-t-2 border-gray-200 pt-3"
      >
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Total</span>
          <motion.span
            key={calculatedTotal}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-primary"
          >
            {formatPrice(calculatedTotal)}
          </motion.span>
        </div>
      </motion.div>
    </div>
  );
}

// Compact price display for cards
PriceDisplay.Compact = function CompactPrice({ price, originalPrice, className }) {
  const hasDiscount = originalPrice && originalPrice > price;
  
  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className="text-xl font-bold text-primary">
        {formatPrice(price)}
      </span>
      {hasDiscount && (
        <span className="text-sm text-gray-400 line-through">
          {formatPrice(originalPrice)}
        </span>
      )}
    </div>
  );
};

// Price range display
PriceDisplay.Range = function PriceRange({ min, max, className }) {
  if (!max || min === max) {
    return (
      <span className={cn('font-bold text-primary', className)}>
        {formatPrice(min)}
      </span>
    );
  }
  
  return (
    <span className={cn('font-bold text-primary', className)}>
      {formatPrice(min)} - {formatPrice(max)}
    </span>
  );
};

export default PriceDisplay;
