'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Target, CheckCircle2, Layers } from 'lucide-react';
import { CandidateDashboardData } from '../services/dashboard.service';
import { useTestCatalog } from '../hooks/useTestCatalog';

interface CandidateKpiSectionProps {
  dashboard?: CandidateDashboardData | null;
  metrics?: {
    bestScore?: number;
    averageAccuracy?: number;
    attemptCount?: number;
  } | null;
  isLoading?: boolean;
}

export const CandidateKpiSection = React.memo(function CandidateKpiSection({
  dashboard,
  metrics,
  isLoading,
}: CandidateKpiSectionProps) {
  const { pagination, isLoading: isCatalogLoading } = useTestCatalog({ limit: 1 });

  if (isLoading || isCatalogLoading) {
    return (
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6'>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className='rounded-[24px] border border-border/40 p-6 bg-card shadow-2xs h-40'
          >
            <Skeleton className='w-11 h-11 rounded-2xl mb-6' />
            <Skeleton className='h-3.5 w-24 mb-2' />
            <Skeleton className='h-8 w-16' />
          </div>
        ))}
      </div>
    );
  }

  const hasAttempts = (metrics?.attemptCount ?? 0) > 0 || (dashboard?.completedAttempts?.length ?? 0) > 0;
  const bestScoreVal = metrics?.bestScore;
  const bestScore = bestScoreVal !== undefined && bestScoreVal !== null ? `${Math.round(bestScoreVal)}%` : 'No score yet';
  const avgAccuracyVal = metrics?.averageAccuracy;
  const avgAccuracy = avgAccuracyVal !== undefined && avgAccuracyVal !== null ? `${Math.round(avgAccuracyVal)}%` : '0%';
  const attempts = metrics?.attemptCount ?? dashboard?.completedAttempts?.length ?? 0;
  const totalAssessments = pagination?.total || 0;

  const cards = [
    {
      label: 'Best Score',
      value: bestScore,
      icon: Trophy,
      iconStyle:
        'bg-[#eff2ff] text-[#6366f1] dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-100/50 dark:border-indigo-900/40',
      subtitle: undefined,
      glow: 'bg-[#eff2ff]/80 dark:bg-indigo-900/20',
    },
    {
      label: 'Average Accuracy',
      value: avgAccuracy,
      icon: Target,
      iconStyle:
        'bg-[#fff7ed] text-[#ea580c] dark:bg-amber-950/50 dark:text-amber-400 border-orange-100/50 dark:border-amber-900/40',
      subtitle: undefined,
      glow: 'bg-[#fff7ed]/80 dark:bg-amber-900/10',
    },
    {
      label: 'Completed Attempts',
      value: attempts.toString(),
      icon: CheckCircle2,
      iconStyle:
        'bg-[#ecfdf5] text-[#10b981] dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/40',
      subtitle: undefined,
      glow: 'bg-[#ecfdf5]/80 dark:bg-emerald-900/10',
    },
    {
      label: 'Available Catalog',
      value: totalAssessments.toString(),
      icon: Layers,
      iconStyle:
        'bg-[#eff2ff] text-[#3b82f6] dark:bg-blue-950/50 dark:text-blue-400 border-blue-100/50 dark:border-blue-900/40',
      subtitle: 'Available assessments',
      glow: 'bg-[#eff2ff]/80 dark:bg-blue-900/10',
    },
  ];

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6'>
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className='rounded-[24px] border border-border/50 bg-card p-6 shadow-2xs hover:shadow-sm transition-all relative overflow-hidden flex flex-col justify-between group'
          >
            <div
              className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-transform group-hover:scale-110 ${card.glow}`}
            />

            <div>
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${card.iconStyle} shrink-0 transition-transform group-hover:scale-105`}
              >
                <Icon className='size-5' />
              </div>
            </div>

            <div className='mt-6 z-10'>
              <div className='text-xs font-medium text-muted-foreground'>{card.label}</div>
              <div className='text-3xl font-extrabold text-foreground mt-1 tracking-tight'>
                {card.value}
              </div>
              {card.subtitle && (
                <p className='text-xs text-muted-foreground/70 mt-1.5 font-normal truncate'>
                  {card.subtitle}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
