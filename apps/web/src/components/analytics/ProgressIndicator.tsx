import { cn } from '@/lib/utils';

export interface ProgressIndicatorProps {
  label: string;
  progress: number;
  color?: string;
  className?: string;
}

export function ProgressIndicator({ label, progress, color, className }: ProgressIndicatorProps) {
  // Cap progress between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className='flex justify-between items-center text-sm font-medium'>
        <span>{label}</span>
        <span className='text-muted-foreground'>{normalizedProgress}%</span>
      </div>
      <div className='h-2 w-full bg-muted rounded-full overflow-hidden'>
        <div
          className={cn('h-full rounded-full transition-all duration-500', color || 'bg-primary')}
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
    </div>
  );
}
