'use client';

import { useTestTimer } from '../hooks/useTestTimer';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TimerWidget() {
  const { formattedTime, isWarning } = useTestTimer();

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-semibold border transition-colors',
        isWarning
          ? 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse'
          : 'bg-muted text-muted-foreground border-border',
      )}
      aria-live='polite'
    >
      <Clock className='w-5 h-5' />
      <span>{formattedTime}</span>
    </div>
  );
}
