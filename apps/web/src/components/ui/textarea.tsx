import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'flex w-full min-h-[80px] px-4 py-2.5 bg-background border border-input rounded-md text-foreground shadow-sm',
        'transition-all duration-300 ease-out',
        'placeholder:text-muted-foreground/70',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50',
        'hover:border-input-hover hover:shadow-md',
        'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20 aria-invalid:focus-visible:border-destructive',
        'resize-y',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
