import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  isLoading?: boolean;
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, description, icon, trend, isLoading, className, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn('overflow-hidden p-5', className)} isLoading={isLoading} {...props}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 mb-3 pb-0">
          <CardTitle className="text-lg font-semibold text-muted-foreground">{title}</CardTitle>
          {icon && <div className="text-primary bg-primary/10 p-2.5 rounded-xl [&>svg]:size-6">{icon}</div>}
        </CardHeader>
        <CardContent className="mb-0">
          <div className="text-4xl font-bold tracking-tight text-foreground">{value}</div>
          {(description || trend) && (
            <div className="mt-2 flex items-center space-x-2 text-sm">
              {trend && (
                <span
                  className={cn(
                    'font-medium flex items-center gap-0.5',
                    trend.direction === 'up' && 'text-emerald-600 dark:text-emerald-400',
                    trend.direction === 'down' && 'text-destructive',
                    trend.direction === 'neutral' && 'text-muted-foreground'
                  )}
                >
                  {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : ''}{' '}
                  {trend.value}%
                </span>
              )}
              {trend && description && <span className="text-border">|</span>}
              {description && <span className="text-muted-foreground">{description}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
StatCard.displayName = 'StatCard';
