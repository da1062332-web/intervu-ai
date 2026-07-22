import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AnimatedLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'page' | 'section' | 'table' | 'button';
  text?: string;
}

export function AnimatedLoader({
  variant = 'section',
  text,
  className,
  ...props
}: AnimatedLoaderProps) {
  const isPage = variant === 'page';
  const isTable = variant === 'table';
  const isButton = variant === 'button';

  if (isButton) {
    return (
      <div className={cn('inline-flex items-center justify-center', className)} {...props}>
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {text && <span className="ml-2">{text}</span>}
      </div>
    );
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <svg
          className={cn(
            'animate-spin text-primary',
            isPage ? 'h-14 w-14' : isTable ? 'h-6 w-6' : 'h-10 w-10'
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-10" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
      </div>
      {text && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide">
          {text}
        </p>
      )}
    </div>
  );

  if (isPage) {
    return (
      <div
        className={cn('fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm', className)}
        {...props}
      >
        {spinner}
      </div>
    );
  }

  if (isTable) {
    return (
      <div
        className={cn('w-full p-8 flex items-center justify-center', className)}
        {...props}
      >
        {spinner}
      </div>
    );
  }

  // Section variant
  return (
    <div
      className={cn('w-full min-h-[200px] flex items-center justify-center rounded-lg border border-dashed border-border/50 bg-muted/10', className)}
      {...props}
    >
      {spinner}
    </div>
  );
}
