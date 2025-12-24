// EventMax Design System - Animation Presets
// Based on BookMyShow and industry best practices

export const animations = {
  // Durations
  durations: {
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
    slower: 0.8,
  },

  // Easings
  easings: {
    easeOut: [0, 0, 0.2, 1],
    easeIn: [0.4, 0, 1, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    spring: { type: 'spring', stiffness: 300, damping: 30 },
    bounce: { type: 'spring', stiffness: 400, damping: 10 },
  },

  // Page Transitions
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },

  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 },
  },

  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  },

  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  },

  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4 },
  },

  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4 },
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2 },
  },

  popIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },

  // Slide animations
  slideUp: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },

  slideDown: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' },
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },

  // Modal/Dialog
  modalBackdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },

  modalContent: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },

  // Bottom Sheet (mobile)
  bottomSheet: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },

  // Card hover
  cardHover: {
    rest: { y: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    hover: { y: -4, boxShadow: '0 8px 25px rgba(0,0,0,0.15)' },
  },

  // Button press
  buttonTap: {
    scale: 0.98,
  },

  // Stagger children
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },

  // Seat selection
  seatSelect: {
    initial: { scale: 1 },
    selected: { scale: 1.1 },
    transition: { type: 'spring', stiffness: 400, damping: 15 },
  },

  // Confetti burst (for confirmation)
  confetti: {
    initial: { opacity: 0, scale: 0, rotate: 0 },
    animate: { 
      opacity: [0, 1, 1, 0], 
      scale: [0.5, 1.2, 1, 0.8],
      rotate: [0, 180, 360],
    },
    transition: { duration: 2, ease: 'easeOut' },
  },

  // Pulse (for urgency)
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },

  // Shake (for errors)
  shake: {
    animate: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.4 },
    },
  },

  // Countdown timer urgency
  timerUrgent: {
    animate: {
      color: ['#EF4444', '#FFFFFF', '#EF4444'],
      scale: [1, 1.1, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
      },
    },
  },
};

// Helper function for stagger animations
export const createStaggerAnimation = (delay = 0.1) => ({
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: delay,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  },
});

// Helper for scroll-triggered animations
export const scrollReveal = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export default animations;
