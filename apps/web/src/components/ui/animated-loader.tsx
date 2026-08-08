import * as React from 'react';
import { Clock } from 'lucide-react';
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
        <Clock className='animate-spin h-4 w-4' />
        {text && <span className='ml-2'>{text}</span>}
      </div>
    );
  }

  const spinner = (
    <div className='flex flex-col items-center justify-center space-y-4'>
      <div className='relative'>
        <Clock
          className={cn(
            'animate-spin text-primary relative z-10',
            isPage ? 'h-14 w-14' : isTable ? 'h-6 w-6' : 'h-10 w-10',
          )}
        />
        <div className='absolute inset-0 bg-primary/20 blur-xl rounded-full' />
      </div>
      {text && (
        <p className='text-sm font-medium text-muted-foreground animate-pulse tracking-wide'>
          {text}
        </p>
      )}
    </div>
  );

  if (isPage) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
          className,
        )}
        {...props}
      >
        {spinner}
      </div>
    );
  }

  if (isTable) {
    return (
      <div className={cn('w-full p-8 flex items-center justify-center', className)} {...props}>
        {spinner}
      </div>
    );
  }

  // Section variant
  return (
    <div
      className={cn(
        'w-full min-h-[200px] flex items-center justify-center rounded-lg border border-dashed border-border/50 bg-muted/10',
        className,
      )}
      {...props}
    >
      {spinner}
    </div>
  );
}
