'use client';

import React from 'react';

interface DifficultyStats {
  easy: { attempted: number; correct: number };
  medium: { attempted: number; correct: number };
  hard: { attempted: number; correct: number };
}

export const DifficultyAnalysis = React.memo(function DifficultyAnalysis({
  stats,
}: {
  stats: DifficultyStats;
}) {
  const getPercentage = (correct: number, attempted: number) => {
    if (!attempted || attempted === 0) return 0;
    return Math.max(0, Math.min(100, Math.round((correct / attempted) * 100)));
  };

  const levels = [
    {
      label: 'Easy',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      dotColor: 'bg-emerald-500',
      strokeColor: '#10b981',
      data: stats?.easy || { attempted: 0, correct: 0 },
    },
    {
      label: 'Medium',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      dotColor: 'bg-amber-500',
      strokeColor: '#f59e0b',
      data: stats?.medium || { attempted: 0, correct: 0 },
    },
    {
      label: 'Hard',
      badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      dotColor: 'bg-rose-500',
      strokeColor: '#f43f5e',
      data: stats?.hard || { attempted: 0, correct: 0 },
    },
  ];

  return (
    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 text-center py-1'>
      {levels.map((lvl) => {
        const pct = getPercentage(lvl.data.correct, lvl.data.attempted);
        const radius = 28;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (pct / 100) * circumference;

        return (
          <div
            key={lvl.label}
            className='p-4 border border-border/50 rounded-xl bg-card/60 shadow-2xs hover:bg-card transition-all flex flex-col items-center justify-between'
          >
            {/* Header Tag */}
            <div
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border mb-3 flex items-center gap-1.5 ${lvl.badgeClass}`}
            >
              <div className={`w-2 h-2 rounded-full ${lvl.dotColor}`} />
              {lvl.label}
            </div>

            {/* SVG Circular Donut Chart */}
            <div className='relative size-20 flex items-center justify-center my-1'>
              <svg className='size-full -rotate-90' viewBox='0 0 70 70'>
                {/* Background Track Ring */}
                <circle
                  cx='35'
                  cy='35'
                  r={radius}
                  className='stroke-muted/40'
                  strokeWidth='6'
                  fill='transparent'
                />
                {/* Foreground Filled Ring */}
                <circle
                  cx='35'
                  cy='35'
                  r={radius}
                  stroke={lvl.strokeColor}
                  strokeWidth='6'
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap='round'
                  fill='transparent'
                  className='transition-all duration-700 ease-out'
                />
              </svg>

              {/* Center Percentage Display */}
              <div className='absolute flex flex-col items-center justify-center text-center'>
                <span className='font-extrabold text-base leading-none text-foreground'>
                  {pct}%
                </span>
                <span className='text-[9px] font-semibold text-muted-foreground uppercase mt-0.5'>
                  Accuracy
                </span>
              </div>
            </div>

            {/* Questions Correct Subtitle */}
            <div className='text-xs font-medium text-muted-foreground mt-3 pt-2 border-t border-border/30 w-full'>
              <strong className='text-foreground font-semibold'>{lvl.data.correct}</strong> /{' '}
              {lvl.data.attempted} correct
            </div>
          </div>
        );
      })}
    </div>
  );
});
