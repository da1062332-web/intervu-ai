import { ReactNode } from 'react';
import { EmptyStateCard } from '@/components/ui/empty-state';

export interface EmptyAnalyticsStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function EmptyAnalyticsState({ title, description, icon }: EmptyAnalyticsStateProps) {
  return (
    <EmptyStateCard
      title={title}
      description={description}
      icon={icon}
      cardClassName="h-full min-h-[200px]"
    />
  );
}
