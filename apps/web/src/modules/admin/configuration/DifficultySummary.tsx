'use client';

import React from 'react';
import { TrendingUp, CheckCircle2, XCircle } from 'lucide-react';

interface DifficultySummaryProps {
  easy: number;
  medium: number;
  hard: number;
  totalQuestions?: number;
}

/**
 * Task Group 9 — DifficultySummary
 * Displays easy/medium/hard distribution with a stacked bar and validity indicator.
 */
export function DifficultySummary({ easy, medium, hard, totalQuestions }: DifficultySummaryProps) {
  const total = easy + medium + hard;
  const isValid = total === 100;

  const easyCount = totalQuestions ? Math.round((easy / 100) * totalQuestions) : null;
  const mediumCount = totalQuestions ? Math.round((medium / 100) * totalQuestions) : null;
  const hardCount = totalQuestions ? Math.round((hard / 100) * totalQuestions) : null;

  return (
    <div className='border rounded-xl overflow-hidden bg-background shadow-sm'>
      <div className='px-5 py-4 border-b bg-muted/20 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <TrendingUp className='w-4 h-4 text-muted-foreground' />
          <h4 className='font-semibold text-sm'>Difficulty Distribution</h4>
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-medium ${isValid ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}
        >
          {isValid ? (
            <>
              <CheckCircle2 className='w-3.5 h-3.5' /> Valid
            </>
          ) : (
            <>
              <XCircle className='w-3.5 h-3.5' /> {total}% total
            </>
          )}
        </div>
      </div>

      <div className='px-5 py-4 space-y-4'>
        {/* Stacked bar */}
        {total > 0 && (
          <div className='flex h-3 rounded-full overflow-hidden gap-0.5'>
            {easy > 0 && (
              <div
                className='bg-green-400 dark:bg-green-600 transition-all duration-500'
                style={{ width: `${easy}%` }}
                title={`Easy: ${easy}%`}
              />
            )}
            {medium > 0 && (
              <div
                className='bg-amber-400 dark:bg-amber-600 transition-all duration-500'
                style={{ width: `${medium}%` }}
                title={`Medium: ${medium}%`}
              />
            )}
            {hard > 0 && (
              <div
                className='bg-red-400 dark:bg-red-600 transition-all duration-500'
                style={{ width: `${hard}%` }}
                title={`Hard: ${hard}%`}
              />
            )}
          </div>
        )}
        {total === 0 && <div className='h-3 rounded-full bg-muted' />}

        {/* Legend */}
        <div className='grid grid-cols-3 gap-3'>
          {[
            {
              label: 'Easy',
              value: easy,
              count: easyCount,
              color: 'bg-green-400',
              textColor: 'text-green-700 dark:text-green-400',
            },
            {
              label: 'Medium',
              value: medium,
              count: mediumCount,
              color: 'bg-amber-400',
              textColor: 'text-amber-700 dark:text-amber-400',
            },
            {
              label: 'Hard',
              value: hard,
              count: hardCount,
              color: 'bg-red-400',
              textColor: 'text-red-700 dark:text-red-400',
            },
          ].map(({ label, value, count, color, textColor }) => (
            <div
              key={label}
              className='flex flex-col items-center p-3 rounded-lg border bg-muted/20 text-center'
            >
              <div className={`w-2.5 h-2.5 rounded-full ${color} mb-1.5`} />
              <span className='text-xs text-muted-foreground'>{label}</span>
              <span className={`text-lg font-bold ${textColor}`}>{value}%</span>
              {count !== null && (
                <span className='text-xs text-muted-foreground mt-0.5'>{count} Q</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
