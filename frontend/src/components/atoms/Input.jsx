// EventMax Input Component
// Reusable form input with validation states

import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Input = forwardRef(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  containerClassName,
  ...props
}, ref) => {
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-xl border bg-white text-gray-900',
            'placeholder-gray-400 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error 
              ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' 
              : 'border-gray-200',
            className
          )}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <p className={cn(
          'mt-1.5 text-sm',
          error ? 'text-red-500' : 'text-gray-500'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
