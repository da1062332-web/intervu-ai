'use client';

import React from 'react';
import { useDifficultyDistribution } from '../hooks/use-difficulty-distribution';

interface ValidationWidgetProps {
  configId: string;
}

export function ValidationWidget({ configId }: ValidationWidgetProps) {
  const { data: distribution, isLoading } = useDifficultyDistribution(configId);

  if (isLoading) {
    return (
      <div className='p-4 border rounded-lg bg-background shadow-sm animate-pulse'>
        <div className='h-4 bg-muted rounded w-1/3 mb-2' />
        <div className='h-6 bg-muted rounded w-2/3' />
      </div>
    );
  }

  const easyPercentage = distribution?.easyPercentage ?? 0;
  const mediumPercentage = distribution?.mediumPercentage ?? 0;
  const hardPercentage = distribution?.hardPercentage ?? 0;
  const totalPercentage = easyPercentage + mediumPercentage + hardPercentage;
  const isValid = totalPercentage === 100;

  return (
    <div
      className={`p-4 border rounded-lg shadow-sm ${
        isValid
          ? 'border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-950/10'
          : 'border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10'
      }`}
    >
      <h4 className='text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-2'>
        Configuration Health
      </h4>
      <div className='flex items-center justify-between'>
        <div className='text-sm font-medium'>
          Difficulty Total ={' '}
          <span
            className={
              isValid
                ? 'text-green-600 dark:text-green-400 font-bold'
                : 'text-red-600 dark:text-red-400 font-bold'
            }
          >
            {totalPercentage}%
          </span>
        </div>
        <div
          className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
            isValid
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {isValid ? '✓ VALID' : '✗ INVALID'}
        </div>
      </div>
    </div>
  );
}
