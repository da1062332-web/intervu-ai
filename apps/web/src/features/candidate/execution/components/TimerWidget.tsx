'use client';

import { useTestTimer } from '../hooks/useTestTimer';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TimerWidget() {
  const { formattedTime, isWarning } = useTestTimer();

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-mono text-xs sm:text-sm md:text-lg font-semibold border transition-colors shrink-0 tabular-nums whitespace-nowrap',
        isWarning
          ? 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse'
          : 'bg-muted text-muted-foreground border-border',
      )}
      aria-live='polite'
    >
      <Clock className='w-3.5 h-3.5 sm:w-5 sm:h-5 shrink-0' />
      <span>{formattedTime}</span>
    </div>
  );
}
