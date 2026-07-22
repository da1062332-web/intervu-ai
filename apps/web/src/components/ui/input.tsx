import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  isLoading?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startIcon, endIcon, isLoading, ...props }, ref) => {
    const hasIcon = !!startIcon || !!endIcon || isLoading;

    const baseInputStyles = cn(
      'w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900',
      'placeholder-gray-500 transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      'dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400',
      'dark:focus:ring-blue-400',
      'disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-gray-900',
      'aria-invalid:border-red-500 aria-invalid:focus:ring-red-500 dark:aria-invalid:border-red-500 dark:aria-invalid:focus:ring-red-500'
    );

    if (!hasIcon) {
      return (
        <input
          type={type}
          className={cn(baseInputStyles, className)}
          ref={ref}
          {...props}
        />
      );
    }

    return (
      <div className="relative flex w-full items-center">
        {startIcon && (
          <div className="absolute left-3 text-gray-500 dark:text-gray-400 flex items-center justify-center">
            {startIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            baseInputStyles,
            startIcon && 'pl-10',
            (endIcon || isLoading) && 'pr-10',
            className
          )}
          ref={ref}
          {...props}
        />
        {(endIcon || isLoading) && (
          <div className="absolute right-3 text-gray-500 dark:text-gray-400 flex items-center justify-center">
            {isLoading ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              endIcon
            )}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
