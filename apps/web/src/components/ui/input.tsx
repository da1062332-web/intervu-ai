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
      'flex w-full px-4 py-2.5 bg-background border border-input rounded-md text-foreground shadow-sm',
      'transition-all duration-300 ease-out',
      'placeholder:text-muted-foreground/70',
      'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50',
      'hover:border-input-hover hover:shadow-md',
      'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20 aria-invalid:focus-visible:border-destructive',
    );

    if (!hasIcon) {
      return <input type={type} className={cn(baseInputStyles, className)} ref={ref} {...props} />;
    }

    return (
      <div className='relative flex w-full items-center'>
        {startIcon && (
          <div className='absolute left-3 text-gray-500 dark:text-gray-400 flex items-center justify-center'>
            {startIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            baseInputStyles,
            startIcon && 'pl-10',
            (endIcon || isLoading) && 'pr-10',
            className,
          )}
          ref={ref}
          {...props}
        />
        {(endIcon || isLoading) && (
          <div className='absolute right-3 text-gray-500 dark:text-gray-400 flex items-center justify-center'>
            {isLoading ? (
              <svg
                className='animate-spin h-4 w-4'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
            ) : (
              endIcon
            )}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
