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
    ANSWERED: 'bg-green-600 text-white border-transparent',
    UNANSWERED: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200',
    CURRENT: 'bg-orange-500 text-white border-transparent font-bold',
    MARKED_FOR_REVIEW: 'bg-purple-600 text-white border-transparent',
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
