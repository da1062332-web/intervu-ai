'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';

import { useDashboardWidgets } from '@/modules/results/hooks/results.hooks';

export const PerformanceSnapshot = React.memo(function PerformanceSnapshot() {
  const { data, isLoading, error } = useDashboardWidgets();

  if (isLoading) {
    return (
      <Card className='h-full glass-card'>
        <CardHeader>
          <CardTitle className='text-lg font-semibold flex items-center gap-2'>
            <BarChart3 className='size-5 text-indigo-500' />
            Performance Snapshot
          </CardTitle>
          <CardDescription>Overall performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='space-y-2'>
                <div className='flex justify-between'>
                  <div className='h-4 w-20 bg-muted animate-pulse rounded'></div>
                  <div className='h-4 w-8 bg-muted animate-pulse rounded'></div>
                </div>
                <div className='h-2 bg-muted animate-pulse rounded'></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className='h-full glass-card'>
        <CardContent className='flex-1 flex items-center justify-center text-destructive'>
          Failed to load performance metrics.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='h-full glass-card'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold flex items-center gap-2'>
          <BarChart3 className='size-5 text-indigo-500' />
          Performance Snapshot
        </CardTitle>
        <CardDescription>Overall performance metrics</CardDescription>
      </CardHeader>
      <CardContent className='space-y-5'>
        <div className='space-y-2'>
          <div className='flex items-center justify-between text-sm'>
            <span className='font-medium text-foreground'>Best Score</span>
            <span className='font-semibold text-muted-foreground'>{data.bestScore ?? 0}%</span>
          </div>
          <Progress value={data.bestScore ?? 0} className='h-2 bg-indigo-100' />
        </div>
        <div className='space-y-2'>
          <div className='flex items-center justify-between text-sm'>
            <span className='font-medium text-foreground'>Average Accuracy</span>
            <span className='font-semibold text-muted-foreground'>
              {data.averageAccuracy ? Math.round(data.averageAccuracy) : 0}%
            </span>
          </div>
          <Progress value={data.averageAccuracy ?? 0} className='h-2 bg-blue-100' />
        </div>
        <div className='space-y-2'>
          <div className='flex items-center justify-between text-sm'>
            <span className='font-medium text-foreground'>Assessments Completed</span>
            <span className='font-semibold text-muted-foreground'>{data.attemptCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
