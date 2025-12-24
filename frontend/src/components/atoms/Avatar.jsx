// EventMax Avatar Component
// User avatar with fallback initials

import { cn } from '../../utils/cn';

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
};

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({
  src,
  alt,
  name,
  size = 'md',
  className,
  ...props
}) {
  const initials = getInitials(name || alt);
  
  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden flex items-center justify-center',
        'bg-gradient-to-br from-primary to-secondary text-white font-semibold',
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export default Avatar;
