import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      asChild = false,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      default:
        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md border border-transparent',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent shadow-sm hover:shadow-md',
      outline:
        'border border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md',
      ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
      destructive:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md border border-transparent',
    };

    const sizes = {
      sm: 'px-3 py-1 text-sm rounded-md gap-1.5',
      md: 'px-4 py-2 text-base rounded-md gap-2',
      lg: 'px-6 py-3 text-lg rounded-lg gap-2',
      icon: 'h-10 w-10 flex items-center justify-center p-2 rounded-md',
    };

    const Comp = asChild ? Slot : 'button';

    if (asChild) {
      return (
        <Comp
          className={cn(baseStyles, variants[variant], sizes[size], className)}
          ref={ref}
          disabled={disabled || isLoading}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className='animate-spin h-4 w-4 shrink-0'
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
        )}
        {!isLoading && leftIcon && <span className='shrink-0 flex items-center'>{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className='shrink-0 flex items-center'>{rightIcon}</span>}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button };
