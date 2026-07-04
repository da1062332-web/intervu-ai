'use client';

import React from 'react';

interface PerformanceComparisonChartProps {
  userScore: number;
  averageScore: number;
  topPercentileScore: number;
}

export const PerformanceComparisonChart = React.memo(function PerformanceComparisonChart({
  userScore,
  averageScore,
  topPercentileScore,
}: PerformanceComparisonChartProps) {
  return (
    <div className='w-full space-y-6 mt-4'>
      <div className='relative w-full h-8 bg-muted rounded-full overflow-hidden border'>
        {/* Average Marker */}
        <div
          className='absolute top-0 bottom-0 w-1 bg-foreground/20 z-10'
          style={{ left: `${averageScore}%` }}
          title={`Average: ${averageScore}%`}
        />

        {/* Top Percentile Marker */}
        <div
          className='absolute top-0 bottom-0 w-1 bg-yellow-500/50 z-10'
          style={{ left: `${topPercentileScore}%` }}
          title={`Top 10%: ${topPercentileScore}%`}
        />

        {/* User Score Bar */}
        <div
          className={`h-full transition-all duration-1000 ${
            userScore >= topPercentileScore
              ? 'bg-gradient-to-r from-primary to-yellow-500'
              : userScore >= averageScore
                ? 'bg-gradient-to-r from-primary/50 to-primary'
                : 'bg-gradient-to-r from-orange-400 to-orange-500'
          }`}
          style={{ width: `${userScore}%` }}
        />
      </div>

      <div className='flex justify-between text-xs text-muted-foreground'>
        <div className='flex items-center gap-1.5'>
          <div className='w-3 h-3 rounded-full bg-primary/80' />
          <span>You ({userScore}%)</span>
        </div>
        <div className='flex items-center gap-1.5'>
          <div className='w-3 h-3 rounded-sm bg-foreground/20' />
          <span>Average ({averageScore}%)</span>
        </div>
        <div className='flex items-center gap-1.5'>
          <div className='w-3 h-3 rounded-sm bg-yellow-500/50' />
          <span>Top 10% ({topPercentileScore}%)</span>
        </div>
      </div>
    </div>
  );
});
