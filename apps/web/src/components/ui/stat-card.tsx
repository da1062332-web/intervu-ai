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
      <Card ref={ref} className={cn('', className)} isLoading={isLoading} {...props}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon && <div className="text-gray-500 dark:text-gray-400">{icon}</div>}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {(description || trend) && (
            <div className="mt-1 flex items-center space-x-2 text-xs">
              {trend && (
                <span
                  className={cn(
                    'font-medium',
                    trend.direction === 'up' && 'text-green-600 dark:text-green-400',
                    trend.direction === 'down' && 'text-red-600 dark:text-red-400',
                    trend.direction === 'neutral' && 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : ''}{' '}
                  {trend.value}%
                </span>
              )}
              {trend && description && <span className="text-gray-300 dark:text-gray-700">|</span>}
              {description && <span className="text-gray-500 dark:text-gray-400">{description}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
StatCard.displayName = 'StatCard';
