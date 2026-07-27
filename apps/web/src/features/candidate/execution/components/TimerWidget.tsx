'use client';

import { useTestTimer } from '../hooks/useTestTimer';
import { cn } from '@/lib/utils';

export function TimerWidget() {
  const { formattedTime, isWarning } = useTestTimer();

  return (
    <div
      className={cn(
        'text-sm sm:text-base font-bold text-gray-900 font-sans tabular-nums whitespace-nowrap tracking-wide flex items-center justify-end',
        isWarning ? 'text-red-600 animate-pulse font-extrabold' : ''
      )}
      aria-live='polite'
    >
      <span>Time Left: {formattedTime}</span>
    </div>
  );
}
