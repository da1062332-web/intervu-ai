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
    if (attempted === 0) return 0;
    return Math.round((correct / attempted) * 100);
  };

  const levels = [
    { label: 'Easy', color: 'bg-green-500', data: stats.easy },
    { label: 'Medium', color: 'bg-orange-500', data: stats.medium },
    { label: 'Hard', color: 'bg-red-500', data: stats.hard },
  ];

  return (
    <div className='grid grid-cols-3 gap-4 text-center'>
      {levels.map((lvl) => {
        const pct = getPercentage(lvl.data.correct, lvl.data.attempted);
        return (
          <div key={lvl.label} className='p-4 border rounded-xl bg-card'>
            <div className='text-sm font-medium text-muted-foreground mb-2 flex items-center justify-center gap-1.5'>
              <div className={`w-2 h-2 rounded-full ${lvl.color}`} />
              {lvl.label}
            </div>

            <div className='relative w-16 h-16 mx-auto mb-2'>
              {/* Circular progress equivalent using conic-gradient */}
              <div
                className='absolute inset-0 rounded-full'
                style={{
                  background: `conic-gradient(var(--primary) ${pct}%, transparent 0)`,
                }}
              />
              <div className='absolute inset-1 bg-card rounded-full flex items-center justify-center'>
                <span className='font-bold text-lg'>{pct}%</span>
              </div>
            </div>

            <div className='text-xs text-muted-foreground'>
              {lvl.data.correct} / {lvl.data.attempted} correct
            </div>
          </div>
        );
      })}
    </div>
  );
});
