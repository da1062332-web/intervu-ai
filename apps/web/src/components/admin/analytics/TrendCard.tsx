import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonChart } from './SkeletonChart';
import { EmptyAnalyticsState } from './EmptyAnalyticsState';
export interface ChartData {
  name: string;
  value: number;
}

export interface TrendCardProps {
  title: string;
  data: ChartData[];
  trendValue: string;
  isLoading?: boolean;
  isError?: boolean;
}
import { memo } from 'react';

export const TrendCard = memo(function TrendCard({
  title,
  data,
  trendValue,
  isLoading,
  isError,
}: TrendCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-lg font-semibold'>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonChart />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <EmptyAnalyticsState
            title='Failed to load analytics'
            description="We couldn't fetch the trend data."
          />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <EmptyAnalyticsState
            title='No analytics available yet'
            description='Check back later for trend insights.'
          />
        </CardContent>
      </Card>
    );
  }

  // Find max for simple bar visualization
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <Card className='flex flex-col h-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg font-semibold'>{title}</CardTitle>
          <span className='text-sm font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md'>
            {trendValue}
          </span>
        </div>
      </CardHeader>
      <CardContent className='flex-1 flex items-end gap-2 pt-4'>
        {data.map((item, index) => (
          <div key={index} className='flex flex-col items-center flex-1 gap-2'>
            <div className='w-full bg-primary/10 rounded-t-sm relative flex-1 min-h-[100px]'>
              <div
                className='absolute bottom-0 w-full bg-primary rounded-t-sm transition-all duration-500'
                style={{ height: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <span className='text-xs text-muted-foreground'>{item.name}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});
