import React from 'react';
import { usePerformanceDashboard } from '../hooks/results.hooks';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { DashboardScoreCard } from './DashboardScoreCard';
import { DashboardStrengthWeakness } from './DashboardStrengthWeakness';
import { DashboardOverallAccuracy } from './DashboardOverallAccuracy';
import { DashboardSectionAccuracy } from './DashboardSectionAccuracy';
import { DashboardCodingCard } from './DashboardCodingCard';
import { DashboardRecommendations } from './DashboardRecommendations';
import { DashboardSectionTime } from './DashboardSectionTime';
import { HiringEvaluationCard } from '@/features/candidate/results/components/HiringEvaluationCard';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, RotateCcw, BarChart3, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  attemptId: string;
  resultDetails?: any;
}

export const PerformanceInsightsDashboard: React.FC<Props> = ({ attemptId, resultDetails }) => {
  const { data, isLoading, isError } = usePerformanceDashboard(attemptId);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className='py-12 flex justify-center'>
        <Loading />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title='Dashboard Unavailable'
        description='Could not load the performance insights for this attempt.'
      />
    );
  }

  const d = data as any;
  const qual = d?.qualification || resultDetails?.qualification;
  const qualReason = d?.qualificationReason || resultDetails?.qualificationReason;
  const evalStrategy = d?.evaluationStrategy || resultDetails?.evaluationStrategy || 'TCS';
  const foundationScore = d?.foundationScore ?? resultDetails?.foundationScore ?? 0;
  const advancedScore = d?.advancedScore ?? resultDetails?.advancedScore ?? 0;
  const codingSolved = d?.codingSolved ?? resultDetails?.codingSolved ?? 0;
  const qualificationDetails = d?.qualificationDetails || resultDetails?.qualificationDetails;

  return (
    <div className='space-y-6'>
      {/* 1. Top KPI Metrics Cards Row (Page 1 Continued) */}
      <div className='pdf-section'>
        <DashboardScoreCard data={data} resultDetails={resultDetails} />
      </div>

      {/* 2. Corporate Hiring Qualification Evaluation (Page 2) */}
      {(qual || qualificationDetails) && (
        <div className='pdf-section'>
          <HiringEvaluationCard
            qualification={qual}
            qualificationReason={qualReason}
            evaluationStrategy={evalStrategy}
            foundationScore={foundationScore}
            advancedScore={advancedScore}
            codingSolved={codingSolved}
            qualificationDetails={qualificationDetails}
          />
        </div>
      )}

      {/* 3. Performance Overview (Radar + Horizontal Progress Bars) (Page 3) */}
      <div className='pdf-section'>
        <DashboardOverallAccuracy data={data} />
      </div>

      {/* 4. AI Generated Recommendations (Page 4) */}
      <div className='pdf-section'>
        <DashboardRecommendations data={data} attemptId={attemptId} />
      </div>

      {/* 5. Section Performance Table Card (Page 5) */}
      <div className='pdf-section'>
        <DashboardSectionAccuracy data={data} attemptId={attemptId} />
      </div>

      {/* 7. Coding Evaluation Card (Page 6) */}
      <div className='pdf-section'>
        <DashboardCodingCard data={data} attemptId={attemptId} />
      </div>

      {/* 8. Section Time & Pacing Breakdown (Page 7) */}
      <div className='pdf-section'>
        <DashboardSectionTime data={data} />
      </div>
    </div>
  );
};
