import { QuestionStatus } from '../types/execution.types';
import { cn } from '@/lib/utils';
import { memo } from 'react';

export interface QuestionStatusBadgeProps {
  index: number;
  status: QuestionStatus;
  isAnswered: boolean;
  onClick: (index: number) => void;
}

export const QuestionStatusBadge = memo(function QuestionStatusBadge({
  index,
  status,
  isAnswered,
  onClick,
}: QuestionStatusBadgeProps) {
  const styles: Record<QuestionStatus, string> = {
    ANSWERED: 'bg-primary text-primary-foreground border-transparent',
    UNANSWERED:
      'bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground',
    CURRENT: 'bg-primary/20 text-primary border-primary font-bold',
    MARKED_FOR_REVIEW: 'bg-orange-500 text-white border-transparent',
  };

  return (
    <button
      onClick={() => onClick(index)}
      className={cn(
        'relative flex items-center justify-center w-10 h-10 rounded-md text-sm font-medium transition-colors border',
        styles[status],
      )}
      aria-label={`Question ${index + 1}, Status: ${status.toLowerCase()}`}
    >
      {index + 1}
      {isAnswered && status !== 'ANSWERED' && (
        <span className='absolute -top-1 -right-1 flex h-3 w-3' aria-hidden='true'>
          <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75'></span>
          <span className='relative inline-flex rounded-full h-3 w-3 bg-green-50 border border-white dark:border-gray-900'></span>
        </span>
      )}
    </button>
  );
});
