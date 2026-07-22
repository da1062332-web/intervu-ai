'use client';
import React from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { Trophy, Target, FileText } from 'lucide-react';

import { useCandidateDashboardMetrics } from '../hooks/useCandidateDashboard';

export const PerformanceSnapshot = React.memo(function PerformanceSnapshot() {
  const { data, isLoading, error } = useCandidateDashboardMetrics();

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {[1, 2, 3].map((i) => (
          <StatCard
            key={i}
            title='Loading...'
            value='-'
            isLoading={true}
          />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return null; // Or a gentle error state
  }

  const bestScore = data.bestScore ?? 0;
  const avgAccuracy = data.averageAccuracy ? Math.round(data.averageAccuracy) : 0;
  const attempts = data.attemptCount ?? 0;

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      <StatCard
        title='BEST SCORE'
        value={`${bestScore}%`}
        icon={<Trophy className='size-4' />}
        className='border-indigo-500/20'
      />

      <StatCard
        title='AVG ACCURACY'
        value={`${avgAccuracy}%`}
        icon={<Target className='size-4' />}
        className='border-blue-500/20'
      />

      <StatCard
        title='COMPLETED'
        value={attempts}
        icon={<FileText className='size-4' />}
        className='border-emerald-500/20'
      />
    </div>
  );
});
