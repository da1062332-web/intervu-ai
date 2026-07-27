import { QuestionStatus } from '../types/execution.types';
import { cn } from '@/lib/utils';
import { memo } from 'react';

export interface QuestionStatusBadgeProps {
  index: number;
  displayIndex?: number;
  status: QuestionStatus;
  isAnswered: boolean;
  onClick: (index: number) => void;
  isCurrent?: boolean;
  displayState?: 'ANSWERED' | 'NOT_ANSWERED' | 'MARKED' | 'NOT_VISITED';
}

export const QuestionStatusBadge = memo(function QuestionStatusBadge({
  index,
  displayIndex,
  status,
  isAnswered,
  onClick,
  isCurrent,
  displayState,
}: QuestionStatusBadgeProps) {
  const renderedNumber = displayIndex !== undefined ? displayIndex : index + 1;

  // Derive final display state if not provided directly
  let state = displayState;
  if (!state) {
    if (status === 'MARKED_FOR_REVIEW') state = 'MARKED';
    else if (isAnswered || status === 'ANSWERED') state = 'ANSWERED';
    else if (status === 'CURRENT' || isCurrent) state = 'NOT_ANSWERED';
    else state = 'NOT_VISITED';
  }

  let styleClass = '';
  switch (state) {
    case 'ANSWERED':
      // Green oval/circle shape matching classic CBT
      styleClass = 'bg-[#5cb85c] text-white border border-[#4a9b4a] rounded-full font-bold shadow-xs hover:bg-[#4ea94e]';
      break;
    case 'NOT_ANSWERED':
      // Orange square shape with rounded corners
      styleClass = 'bg-[#e54524] text-white border border-[#c33315] rounded-sm font-bold shadow-xs hover:bg-[#cd3819]';
      break;
    case 'MARKED':
      // Purple oval/circle shape
      styleClass = 'bg-[#8e24aa] text-white border border-[#751c8e] rounded-full font-bold shadow-xs hover:bg-[#7d1c97]';
      break;
    case 'NOT_VISITED':
    default:
      // White/gray square shape with rounded corners
      styleClass = 'bg-white text-gray-700 border border-gray-300 rounded-sm font-semibold shadow-2xs hover:bg-gray-100 hover:text-gray-900';
      break;
  }

  return (
    <button
      onClick={() => onClick(index)}
      className={cn(
        'relative flex items-center justify-center w-full aspect-square text-xs md:text-sm transition-all select-none cursor-pointer',
        styleClass,
        isCurrent ? 'ring-2 ring-offset-1 ring-blue-700 font-extrabold scale-[1.03] z-10' : ''
      )}
      aria-label={`Question ${renderedNumber}, Status: ${state}`}
    >
      <span>{renderedNumber}</span>
    </button>
  );
});
