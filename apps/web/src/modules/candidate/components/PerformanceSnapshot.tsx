'use client';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Target, FileText } from 'lucide-react';

import { useDashboardWidgets } from '@/modules/results/hooks/results.hooks';

export const PerformanceSnapshot = React.memo(function PerformanceSnapshot() {
  const { data, isLoading, error } = useDashboardWidgets();

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {[1, 2, 3].map((i) => (
          <Card key={i} className='glass-card'>
            <CardContent className='p-6 flex items-center justify-between'>
              <div className='space-y-2'>
                <div className='h-4 w-20 bg-muted animate-pulse rounded'></div>
                <div className='h-8 w-12 bg-muted animate-pulse rounded'></div>
              </div>
              <div className='size-10 bg-muted animate-pulse rounded-full'></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return null; // Or a gentle error state, but null keeps the dashboard clean if metrics fail
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      <Card className='glass-card border-l-4 border-l-indigo-500'>
        <CardContent className='p-6 flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-muted-foreground'>Best Score</p>
            <p className='text-3xl font-bold mt-1 text-foreground'>{data.bestScore ?? 0}%</p>
          </div>
          <div className='size-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-600'>
            <Trophy className='size-6' />
          </div>
        </CardContent>
      </Card>

      <Card className='glass-card border-l-4 border-l-blue-500'>
        <CardContent className='p-6 flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-muted-foreground'>Average Accuracy</p>
            <p className='text-3xl font-bold mt-1 text-foreground'>
              {data.averageAccuracy ? Math.round(data.averageAccuracy) : 0}%
            </p>
          </div>
          <div className='size-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600'>
            <Target className='size-6' />
          </div>
        </CardContent>
      </Card>

      <Card className='glass-card border-l-4 border-l-green-500'>
        <CardContent className='p-6 flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-muted-foreground'>Assessments Completed</p>
            <p className='text-3xl font-bold mt-1 text-foreground'>{data.attemptCount ?? 0}</p>
          </div>
          <div className='size-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-600'>
            <FileText className='size-6' />
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
