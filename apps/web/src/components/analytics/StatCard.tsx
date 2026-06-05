import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface StatCardProps {
  title: string;
  value: number | string;
  trend?: string;
  icon?: ReactNode;
}

export function StatCard({ title, value, trend, icon }: StatCardProps) {
  const isPositive = trend?.startsWith('+');
  const isNegative = trend?.startsWith('-');

  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>{title}</CardTitle>
        {icon && <div className='text-muted-foreground'>{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {trend && (
          <p
            className={cn(
              'text-xs mt-1 font-medium',
              isPositive && 'text-emerald-500',
              isNegative && 'text-red-500',
              !isPositive && !isNegative && 'text-muted-foreground',
            )}
          >
            {trend} from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
