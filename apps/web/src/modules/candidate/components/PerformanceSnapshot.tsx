'use client';
import React from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Target, FileText } from 'lucide-react';

import { useCandidateDashboardMetrics } from '../hooks/useCandidateDashboard';

export const PerformanceSnapshot = React.memo(function PerformanceSnapshot() {
  const { data, isLoading, error } = useCandidateDashboardMetrics();

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5'>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className='h-24 w-full rounded-xl border border-border/60 bg-muted/50' />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const bestScore = data.bestScore ?? 0;
  const avgAccuracy = data.averageAccuracy ? Math.round(data.averageAccuracy) : 0;
  const attempts = data.attemptCount ?? 0;

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5'>
      <StatCard
        title='BEST SCORE'
        value={`${bestScore}/100`}
        icon={<Trophy className='size-4 text-indigo-500' />}
        className='bg-card/80 border border-border/60 shadow-xs hover:bg-card transition-all'
      />

      <StatCard
        title='AVG ACCURACY'
        value={`${avgAccuracy}%`}
        icon={<Target className='size-4 text-blue-500' />}
        className='bg-card/80 border border-border/60 shadow-xs hover:bg-card transition-all'
      />

      <StatCard
        title='COMPLETED ATTEMPTS'
        value={attempts}
        icon={<FileText className='size-4 text-emerald-500' />}
        className='bg-card/80 border border-border/60 shadow-xs hover:bg-card transition-all'
      />
    </div>
  );
});
