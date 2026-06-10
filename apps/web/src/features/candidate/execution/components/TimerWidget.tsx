'use client';

import { useEffect } from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TimerWidget() {
  const { remainingTime, setTimer } = useExecutionStore();

  useEffect(() => {
    // Only run the timer if there is time remaining
    if (remainingTime <= 0) return;

    const intervalId = setInterval(() => {
      setTimer(remainingTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [remainingTime, setTimer]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWarning = remainingTime > 0 && remainingTime <= 600; // Under 10 minutes (600s)

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
      <span>{formatTime(remainingTime)}</span>
    </div>
  );
}
