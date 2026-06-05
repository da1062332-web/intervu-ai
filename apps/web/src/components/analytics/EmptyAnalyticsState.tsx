import { BarChart3 } from 'lucide-react';
import { ReactNode } from 'react';

export interface EmptyAnalyticsStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function EmptyAnalyticsState({ title, description, icon }: EmptyAnalyticsStateProps) {
  return (
    <div className='flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px] bg-muted/20 rounded-xl border border-dashed'>
      <div className='size-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground'>
        {icon || <BarChart3 className='size-6' />}
      </div>
      <h3 className='text-lg font-semibold mb-1'>{title}</h3>
      <p className='text-sm text-muted-foreground max-w-sm'>{description}</p>
    </div>
  );
}
