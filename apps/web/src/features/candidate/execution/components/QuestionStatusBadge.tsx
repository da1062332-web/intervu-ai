import { cn } from '@/lib/utils';
import { QuestionStatus } from '../types/execution.types';

interface QuestionStatusBadgeProps {
  status: QuestionStatus;
  index: number;
  onClick?: () => void;
}

export function QuestionStatusBadge({ status, index, onClick }: QuestionStatusBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded-md text-sm font-medium transition-colors border",
        {
          "bg-primary text-primary-foreground border-primary hover:bg-primary/90": status === 'ANSWERED',
          "bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/80": status === 'CURRENT',
          "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground": status === 'UNANSWERED',
        }
      )}
      aria-label={`Question ${index + 1}, Status: ${status.toLowerCase()}`}
    >
      {index + 1}
    </button>
  );
}
