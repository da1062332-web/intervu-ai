'use client';

import { useExecutionStore } from '../stores/execution.store';

export function ProgressTracker() {
  const { questions, answers } = useExecutionStore();

  const total = questions.length;
  const answered = Object.keys(answers).length;
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className='flex flex-col gap-2 w-full max-w-xs'>
      <div className='flex items-center justify-between text-sm font-medium'>
        <span className='text-muted-foreground'>Progress</span>
        <span>
          {answered} / {total} Completed
        </span>
      </div>
      <div className='h-2 w-full bg-muted rounded-full overflow-hidden'>
        <div
          className='h-full bg-primary transition-all duration-300 ease-in-out'
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
