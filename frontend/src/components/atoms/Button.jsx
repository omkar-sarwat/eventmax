// EventMax Button Component
// Reusable button with multiple variants

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-hover shadow-md hover:shadow-lg',
  secondary: 'bg-secondary text-white hover:bg-secondary-hover shadow-md hover:shadow-lg',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg',
  success: 'bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg',
  dark: 'bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
  xl: 'px-10 py-5 text-xl',
  icon: 'p-3',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  ...props
}, ref) => {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-xl',
        'transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      
      {children}
      
      {!loading && rightIcon && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;
