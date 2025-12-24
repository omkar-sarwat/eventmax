// EventMax Badge Component
// Used for status indicators, tags, and labels

import { cn } from '../../utils/cn';

const variants = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  dark: 'bg-gray-800 text-white',
  outline: 'border border-gray-300 text-gray-600',
  trending: 'bg-gradient-to-r from-primary to-secondary text-white',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-sm',
};

function Badge({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

export default Badge;
