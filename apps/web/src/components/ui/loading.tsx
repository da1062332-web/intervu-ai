import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
}

export function Loading({ size = 'md', message, fullScreen = false }: LoadingProps) {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div className='w-full h-full min-h-[400px] flex flex-col items-center justify-center gap-4'>
      <div className={cn('animate-spin', sizeMap[size])}>
        <Clock className='h-full w-full text-blue-600 dark:text-blue-400' />
      </div>

      {message && <p className='text-center text-sm text-gray-600 dark:text-gray-400'>{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className='fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80'>
        {spinner}
      </div>
    );
  }

  return spinner;
}
