// EventMax Countdown Timer Component
// Inspired by Framer Countdown - adapted for booking reservations

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

function CountdownTimer({
  timeRemaining: externalTimeRemaining, // Time remaining in seconds from context
  initialSeconds = 600, // 10 minutes default (matches Redis TTL)
  onExpire,
  onExpiry, // Alias for onExpire
  onWarning,
  warningThreshold = 120, // Warning at 2 minutes
  variant = 'default', // default, compact, box
  showLabels = true,
  orientation = 'horizontal',
  className,
}) {
  // Use external time if provided (and is a valid number), otherwise manage internal state
  const hasExternalTime = typeof externalTimeRemaining === 'number';
  const [internalSeconds, setInternalSeconds] = useState(hasExternalTime ? externalTimeRemaining : initialSeconds);
  const seconds = hasExternalTime ? externalTimeRemaining : internalSeconds;
  const expireCallback = onExpire || onExpiry;
  
  const isWarning = seconds <= warningThreshold;
  const isUrgent = seconds <= 30;
  
  // Track if we've already called onExpire
  const hasExpired = useRef(false);

  // Update internal state when external time changes
  useEffect(() => {
    if (typeof externalTimeRemaining === 'number') {
      setInternalSeconds(externalTimeRemaining);
    }
  }, [externalTimeRemaining]);

  // Handle countdown for internal timer only (when not using external time)
  useEffect(() => {
    if (typeof externalTimeRemaining === 'number') return; // Skip if using external time
    
    if (internalSeconds <= 0) {
      if (!hasExpired.current) {
        hasExpired.current = true;
        expireCallback?.();
      }
      return;
    }

    const timer = setTimeout(() => {
      setInternalSeconds(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [internalSeconds, externalTimeRemaining, expireCallback]);

  // Handle expiry for external timer
  useEffect(() => {
    if (seconds <= 0 && !hasExpired.current) {
      hasExpired.current = true;
      expireCallback?.();
    }
  }, [seconds, expireCallback]);

  // Warning callback
  useEffect(() => {
    if (seconds === warningThreshold) {
      onWarning?.();
    }
  }, [seconds, warningThreshold, onWarning]);

  // Calculate time units
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  // Padded values
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(secs).padStart(2, '0');

  // Colors based on state
  const getColors = () => {
    if (isUrgent) return { bg: 'bg-red-500', text: 'text-white', boxBg: 'bg-red-400/30', label: 'text-red-100' };
    if (isWarning) return { bg: 'bg-amber-500', text: 'text-gray-900', boxBg: 'bg-amber-400/30', label: 'text-amber-900/70' };
    return { bg: 'bg-indigo-600', text: 'text-white', boxBg: 'bg-white/10', label: 'text-indigo-200' };
  };

  const colors = getColors();

  // Time box component for box variant
  const TimeBox = ({ value, label }) => (
    <div className={cn(
      'flex flex-col items-center justify-center rounded-xl px-4 py-3',
      colors.boxBg
    )}
    style={{ minWidth: 64 }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={cn('text-3xl font-bold tabular-nums font-mono', colors.text)}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      {showLabels && (
        <span className={cn('text-xs mt-1 uppercase tracking-wider font-medium', colors.label)}>
          {label}
        </span>
      )}
    </div>
  );

  // Compact variant - simple inline display
  if (variant === 'compact') {
    return (
      <motion.div 
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold',
          colors.bg, colors.text,
          className
        )}
        animate={isUrgent ? { scale: [1, 1.02, 1] } : {}}
        transition={isUrgent ? { repeat: Infinity, duration: 0.5 } : {}}
      >
        {isUrgent ? (
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}>
            <AlertTriangle className="w-4 h-4" />
          </motion.div>
        ) : (
          <Clock className="w-4 h-4" />
        )}
        <span className="tabular-nums font-mono text-base">
          {paddedMinutes}:{paddedSeconds}
        </span>
      </motion.div>
    );
  }

  // Box variant - Framer-style with individual boxes for each unit
  if (variant === 'box') {
    return (
      <motion.div
        className={cn(
          'rounded-2xl p-4',
          colors.bg,
          orientation === 'vertical' ? 'inline-flex flex-col' : 'inline-flex flex-row',
          className
        )}
        animate={isUrgent ? { scale: [1, 1.01, 1] } : {}}
        transition={isUrgent ? { repeat: Infinity, duration: 1 } : {}}
      >
        <div className={cn(
          'flex items-center gap-2',
          orientation === 'vertical' ? 'flex-col' : 'flex-row'
        )}>
          <TimeBox value={paddedMinutes} label="min" />
          <span className={cn('text-3xl font-bold', colors.text)}>:</span>
          <TimeBox value={paddedSeconds} label="sec" />
        </div>
        
        {isWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={cn(
              'flex items-center justify-center gap-2 mt-3 pt-3 border-t',
              isUrgent ? 'border-red-400/30' : 'border-amber-400/30'
            )}
          >
            <AlertTriangle className={cn('w-4 h-4', colors.text)} />
            <span className={cn('text-sm font-medium', colors.text)}>
              {isUrgent ? 'Complete now!' : 'Hurry up!'}
            </span>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Default variant - clean card style with progress bar
  const progressPercent = (seconds / initialSeconds) * 100;

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-xl px-4 py-3',
        colors.bg,
        className
      )}
      animate={isUrgent ? { scale: [1, 1.02, 1] } : {}}
      transition={isUrgent ? { repeat: Infinity, duration: 1 } : {}}
    >
      {/* Progress bar background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className={cn(
            'absolute inset-y-0 left-0 opacity-20',
            isUrgent ? 'bg-red-300' : isWarning ? 'bg-amber-300' : 'bg-indigo-400'
          )}
          initial={{ width: '100%' }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Content */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isUrgent ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <AlertTriangle className={cn('w-5 h-5', colors.text)} />
            </motion.div>
          ) : (
            <Clock className={cn('w-5 h-5', colors.text)} />
          )}
          <span className={cn('text-sm font-medium', colors.text)}>
            {isUrgent ? 'Hurry!' : 'Time remaining'}
          </span>
        </div>

        <div className="flex items-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={`min-${paddedMinutes}`}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={cn('text-2xl font-bold tabular-nums font-mono', colors.text)}
            >
              {paddedMinutes}
            </motion.span>
          </AnimatePresence>
          <span className={cn('text-2xl font-bold mx-0.5', colors.text)}>:</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={`sec-${paddedSeconds}`}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={cn('text-2xl font-bold tabular-nums font-mono', colors.text)}
            >
              {paddedSeconds}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Warning message */}
      {isWarning && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={cn('relative mt-2 text-xs', colors.label)}
        >
          {isUrgent 
            ? 'Complete your booking now or seats will be released!'
            : 'Your seats are reserved. Complete checkout soon.'}
        </motion.p>
      )}
    </motion.div>
  );
}

export default CountdownTimer;
