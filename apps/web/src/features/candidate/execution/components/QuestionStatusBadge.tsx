import { QuestionStatus } from '../types/execution.types';
import { cn } from '@/lib/utils';

interface QuestionStatusBadgeProps {
  index: number;
  status: QuestionStatus;
  onClick: () => void;
}

export function QuestionStatusBadge({ index, status, onClick }: QuestionStatusBadgeProps) {
  const styles: Record<QuestionStatus, string> = {
    ANSWERED: 'bg-primary text-primary-foreground border-transparent',
    UNANSWERED:
      'bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground',
    CURRENT: 'bg-primary/20 text-primary border-primary font-bold',
    MARKED_FOR_REVIEW: 'bg-orange-500 text-white border-transparent',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center w-10 h-10 rounded-md text-sm font-medium transition-colors border',
        {
          'bg-primary text-primary-foreground border-primary hover:bg-primary/90':
            status === 'ANSWERED',
          'bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/80':
            status === 'CURRENT',
          'bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground':
            status === 'UNANSWERED',
        },
      )}
      aria-label={`Question ${index + 1}, Status: ${status.toLowerCase()}`}
    >
      {index + 1}
    </button>
  );
}
