'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Target, CheckCircle2, Layers, ArrowUpRight } from 'lucide-react';
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

  if ((isLoading && !dashboard && !metrics) || (!dashboard && !metrics && isCatalogLoading)) {
    return (
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5'>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className='rounded-[22px] border border-border/50 p-5 sm:p-6 bg-card shadow-2xs h-36 flex flex-col justify-between'
          >
            <div className='flex items-center justify-between'>
              <Skeleton className='h-3.5 w-24' />
              <Skeleton className='w-8 h-8 rounded-xl' />
            </div>
            <Skeleton className='h-8 w-16' />
            <Skeleton className='h-3 w-32' />
          </div>
        ))}
      </div>
    );
  }

  const completedScores = (dashboard?.completedAttempts || [])
    .map((a) => a.score)
    .filter((s): s is number => typeof s === 'number');

  const rawBest =
    metrics?.bestScore !== undefined && metrics?.bestScore !== null
      ? Math.round(metrics.bestScore)
      : completedScores.length > 0
      ? Math.round(Math.max(...completedScores))
      : null;

  const bestScore = rawBest !== null ? `${rawBest}%` : '0%';

  const avgAccuracy =
    metrics?.averageAccuracy !== undefined && metrics?.averageAccuracy !== null
      ? `${Math.round(metrics.averageAccuracy)}%`
      : completedScores.length > 0
      ? `${Math.round(completedScores.reduce((a, b) => a + b, 0) / completedScores.length)}%`
      : '0%';

  const attempts = metrics?.attemptCount ?? dashboard?.completedAttempts?.length ?? 0;
  const maxAttemptsAllowed = dashboard?.availableTests?.[0]?.maxAttempts ?? 2;

  const totalAssessments =
    dashboard?.availableTests !== undefined
      ? dashboard.availableTests.length
      : (pagination?.total ?? 0);

  const benchmarkText =
    rawBest !== null && rawBest >= 75
      ? 'Benchmark: Top 10%'
      : rawBest !== null && rawBest >= 40
      ? 'Benchmark: Top 50%'
      : rawBest !== null && rawBest > 0
      ? 'Benchmark: Top 90%'
      : 'Benchmark: Inactive';

  const cards = [
    {
      label: 'Best Score',
      value: bestScore,
      icon: Trophy,
      iconStyle:
        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      subtitle: benchmarkText,
      hasArrow: true,
    },
    {
      label: 'Average Accuracy',
      value: avgAccuracy,
      icon: Target,
      iconStyle:
        'bg-sky-500/10 text-sky-400 border-sky-500/20',
      subtitle: 'Aggregation across all tests',
      hasArrow: false,
    },
    {
      label: 'Completed / Attempts',
      value: attempts.toString(),
      icon: CheckCircle2,
      iconStyle:
        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      subtitle: `${attempts} of ${maxAttemptsAllowed} attempts utilised`,
      hasArrow: false,
    },
    {
      label: 'Available Catalog',
      value: totalAssessments.toString(),
      icon: Layers,
      iconStyle:
        'bg-purple-500/10 text-purple-400 border-purple-500/20',
      subtitle: `${totalAssessments} assessment active`,
      hasArrow: false,
    },
  ];

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5'>
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className='rounded-[22px] border border-border/60 bg-card p-5 sm:p-6 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group h-full min-h-[140px]'
          >
            <div className='flex items-center justify-between gap-2'>
              <span className='text-xs font-semibold text-muted-foreground'>
                {card.label}
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${card.iconStyle}`}
              >
                <Icon className='size-4' />
              </div>
            </div>

            <div className='my-2'>
              <div className='text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight'>
                {card.value}
              </div>
            </div>

            <div className='flex items-center gap-1 text-[11px] font-medium text-muted-foreground/80 truncate'>
              {card.hasArrow && <ArrowUpRight className='size-3 text-sky-400 shrink-0' />}
              <span>{card.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
});
