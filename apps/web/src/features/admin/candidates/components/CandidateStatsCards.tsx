'use client';

import * as React from 'react';
import { ClipboardList, CheckCircle2, PlayCircle, Award, Trophy, Calendar } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { formatCandidateDate, formatScore } from '../utils';
import type { CandidateStats } from '../types/candidate.types';

interface CandidateStatsCardsProps {
  stats?: CandidateStats;
  isLoading?: boolean;
}

export function CandidateStatsCards({ stats, isLoading = false }: CandidateStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Assigned Tests"
        value={isLoading ? 0 : stats?.assignedTests ?? 0}
        description="Total enrolled assessments"
        icon={<ClipboardList />}
        isLoading={isLoading}
      />
      <StatCard
        title="Attempted Tests"
        value={isLoading ? 0 : stats?.attemptedTests ?? 0}
        description="Total initiated attempts"
        icon={<PlayCircle />}
        isLoading={isLoading}
      />
      <StatCard
        title="Completed Tests"
        value={isLoading ? 0 : stats?.completedTests ?? 0}
        description="Fully evaluated submissions"
        icon={<CheckCircle2 />}
        isLoading={isLoading}
      />
      <StatCard
        title="Average Score"
        value={isLoading ? '0%' : formatScore(stats?.averageScore)}
        description="Mean evaluation accuracy"
        icon={<Award />}
        isLoading={isLoading}
      />
      <StatCard
        title="Best Score"
        value={isLoading ? '0%' : formatScore(stats?.bestScore)}
        description="Highest evaluation achieved"
        icon={<Trophy />}
        isLoading={isLoading}
      />
      <StatCard
        title="Last Attempt"
        value={isLoading ? '-' : formatCandidateDate(stats?.lastAttempt, 'No attempts yet')}
        description="Most recent test session"
        icon={<Calendar />}
        isLoading={isLoading}
      />
    </div>
  );
}
