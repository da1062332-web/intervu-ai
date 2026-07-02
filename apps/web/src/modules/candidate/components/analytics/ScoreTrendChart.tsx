'use client';

import React from 'react';

interface ScorePoint {
  date: string;
  score: number;
  label?: string;
}

interface ScoreTrendChartProps {
  data: ScorePoint[];
  height?: string;
}

export const ScoreTrendChart = React.memo(function ScoreTrendChart({ 
  data, 
  height = '200px' 
}: ScoreTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className='flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md border border-dashed' style={{ height }}>
        No trend data available
      </div>
    );
  }

  // Ensure we don't have too many bars crowding
  const displayData = data.slice(-10);

  return (
    <div className='w-full flex items-end justify-between gap-2 pt-4 px-2' style={{ height }}>
      {displayData.map((point, i) => (
        <div key={i} className='flex flex-col items-center flex-1 group'>
          <div className='relative w-full flex justify-center mb-2 h-full items-end'>
            {/* Tooltip */}
            <div className='absolute -top-8 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-md border'>
              {point.score}% <span className='text-muted-foreground ml-1'>{point.label || point.date}</span>
            </div>
            
            {/* Bar */}
            <div 
              className='w-full max-w-[40px] bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-colors border-t border-x border-primary/30'
              style={{ height: `${point.score}%`, minHeight: '4px' }}
            >
              <div 
                className='w-full bg-primary/40 rounded-t-sm'
                style={{ height: '4px' }}
              />
            </div>
          </div>
          <span className='text-[10px] text-muted-foreground rotate-45 md:rotate-0 origin-left truncate w-full text-center'>
            {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
      ))}
    </div>
  );
});
