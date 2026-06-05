import { ReactNode } from 'react';

export interface AnalyticsSectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function AnalyticsSectionHeader({
  title,
  description,
  action,
}: AnalyticsSectionHeaderProps) {
  return (
    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
      <div>
        <h2 className='text-2xl font-heading font-semibold tracking-tight'>{title}</h2>
        {description && <p className='text-sm text-muted-foreground mt-1'>{description}</p>}
      </div>
      {action && <div className='flex-shrink-0'>{action}</div>}
    </div>
  );
}
