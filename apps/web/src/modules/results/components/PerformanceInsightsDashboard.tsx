import React from 'react';
import { usePerformanceDashboard } from '../hooks/results.hooks';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { DashboardScoreCard } from './DashboardScoreCard';
import { DashboardStrengthWeakness } from './DashboardStrengthWeakness';
import { DashboardOverallAccuracy } from './DashboardOverallAccuracy';
import { DashboardSectionAccuracy } from './DashboardSectionAccuracy';
import { DashboardSectionTime } from './DashboardSectionTime';
import { DashboardPerformanceSummary } from './DashboardPerformanceSummary';
import { DashboardRecommendations } from './DashboardRecommendations';
import { DashboardCodingCard } from './DashboardCodingCard';
import { HiringEvaluationCard } from '@/features/candidate/results/components/HiringEvaluationCard';

interface Props {
  attemptId: string;
}

export const PerformanceInsightsDashboard: React.FC<Props> = ({ attemptId }) => {
  const { data, isLoading, isError } = usePerformanceDashboard(attemptId);

  if (isLoading) {
    return <div className="py-12 flex justify-center"><Loading /></div>;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Dashboard Unavailable"
        description="Could not load the performance insights for this attempt."
      />
    );
  }

  const d = data as any;

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Performance Insights Dashboard</h2>
        <p className="text-gray-500 dark:text-slate-400">Comprehensive analysis of test performance, strengths, weaknesses, and time management.</p>
      </div>

      {d.qualification && (
        <HiringEvaluationCard
          qualification={d.qualification}
          qualificationReason={d.qualificationReason}
          evaluationStrategy={d.evaluationStrategy}
          foundationScore={d.foundationScore}
          advancedScore={d.advancedScore}
          codingSolved={d.codingSolved}
          qualificationDetails={d.qualificationDetails}
        />
      )}

      <div className="grid grid-cols-1 gap-6">
        <DashboardScoreCard data={data} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardOverallAccuracy data={data} />
        <DashboardPerformanceSummary data={data} />
      </div>

      <DashboardCodingCard data={data} />

      <div className="grid grid-cols-1 gap-6">
        <DashboardStrengthWeakness data={data} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardSectionAccuracy data={data} />
        <DashboardSectionTime data={data} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <DashboardRecommendations data={data} />
      </div>
    </div>
  );
};
