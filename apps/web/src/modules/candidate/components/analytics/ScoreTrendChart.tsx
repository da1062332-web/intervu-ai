'use client';

import React, { useState } from 'react';

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
  height = '260px',
}: ScoreTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className='flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/60 p-6 text-center'
        style={{ height }}
      >
        <p className='text-sm font-semibold text-foreground/80'>
          No score trend data available yet
        </p>
        <p className='text-xs text-muted-foreground mt-1'>
          Complete assessments to view your historical performance timeline.
        </p>
      </div>
    );
  }

  // 1. Sort data chronologically by date
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // 2. Take the most recent 10 items for optimal spacing
  const displayData = sortedData.slice(-10);

  // Y-axis grid levels (0 to 100)
  const yTicks = [100, 75, 50, 25, 0];

  return (
    <div className='w-full flex flex-col space-y-2 select-none'>
      {/* Main Chart Canvas Container */}
      <div className='relative w-full bg-muted/10 rounded-xl border border-border/40 p-4 pt-6 overflow-hidden'>
        {/* Y-Axis Grid Canvas (Height = 200px) */}
        <div className='relative w-full h-[200px]'>
          {/* Y-Axis Grid Lines & Tick Labels */}
          <div className='absolute inset-0 flex flex-col justify-between pointer-events-none z-0'>
            {yTicks.map((tick) => (
              <div key={tick} className='flex items-center w-full gap-2 relative -top-2'>
                <span className='text-[10px] font-mono text-muted-foreground/70 w-8 text-right shrink-0 select-none'>
                  {tick}%
                </span>
                <div className='w-full border-b border-border/35 border-dashed' />
              </div>
            ))}
          </div>

          {/* Bars Layer (Positioned Pl-10 to align right of Y-axis numbers) */}
          <div className='absolute inset-0 pl-10 pr-2 flex items-end justify-between z-10 gap-2'>
            {displayData.map((point, i) => {
              const rawScore = Math.max(0, Math.min(100, Math.round(point.score)));
              // For 0%, show a subtle 3% bottom base line so all attempts are visible
              const heightPercent = rawScore === 0 ? 3 : rawScore;
              const formattedDate = new Date(point.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });
              const isHovered = hoveredIdx === i;

              // Dynamic color gradient based on score tier
              let barGradient = 'from-indigo-600 via-primary to-blue-400';
              let badgeBg = 'bg-primary text-primary-foreground';
              if (rawScore >= 80) {
                barGradient = 'from-emerald-600 via-teal-500 to-green-400';
                badgeBg = 'bg-emerald-600 text-white';
              } else if (rawScore >= 50) {
                barGradient = 'from-indigo-600 via-purple-500 to-indigo-400';
                badgeBg = 'bg-indigo-600 text-white';
              } else {
                barGradient = 'from-rose-500 via-rose-400 to-amber-400';
                badgeBg = 'bg-rose-500 text-white';
              }

              return (
                <div
                  key={`${point.date}-${i}`}
                  className='flex-1 h-full flex flex-col items-center justify-end relative group cursor-pointer'
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Floating Hover Tooltip */}
                  {isHovered && (
                    <div className='absolute -top-12 z-30 bg-popover text-popover-foreground text-xs px-3 py-1.5 rounded-lg shadow-lg border border-border/80 flex flex-col items-center animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap pointer-events-none'>
                      <span className='font-bold text-foreground'>
                        {point.label || 'Assessment'}
                      </span>
                      <span className='text-[11px] text-muted-foreground'>
                        Score: <strong className='text-foreground'>{rawScore}%</strong> •{' '}
                        {formattedDate}
                      </span>
                    </div>
                  )}

                  {/* Outer Bar Track (Spans EXACT 100% of 200px Grid Canvas Height) */}
                  <div className='w-full max-w-[36px] h-full relative flex items-end bg-muted/30 rounded-t-md overflow-visible border-x border-t border-border/40'>
                    {/* Floating Score Pill Badge positioned directly at bar top */}
                    <div
                      className={`absolute left-1/2 -translate-x-1/2 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md transition-all duration-200 shadow-2xs z-20 whitespace-nowrap ${badgeBg} ${
                        isHovered ? 'scale-110 shadow-md' : 'opacity-90'
                      }`}
                      style={{ bottom: `calc(${heightPercent}% + 4px)` }}
                    >
                      {rawScore}%
                    </div>

                    {/* Inner Animated Gradient Fill Bar */}
                    <div
                      className={`w-full bg-gradient-to-t ${barGradient} rounded-t-sm transition-all duration-500 ease-out ${
                        isHovered ? 'brightness-115 shadow-lg shadow-primary/30' : ''
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-Axis Date Labels Row */}
      <div className='flex justify-between items-center pl-14 pr-4 pt-1'>
        {displayData.map((point, i) => {
          const formattedDate = new Date(point.date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          });
          return (
            <span
              key={`x-label-${i}`}
              className={`text-[11px] font-semibold text-center flex-1 transition-colors ${
                hoveredIdx === i ? 'text-primary font-bold' : 'text-muted-foreground/80'
              }`}
            >
              {formattedDate}
            </span>
          );
        })}
      </div>
    </div>
  );
});
