'use client';

import { useCandidateDashboard } from '@/features/candidate-dashboard/hooks/useCandidateDashboard';
import { CandidateDashboardHeader } from '@/features/candidate-dashboard/components/CandidateDashboardHeader';
import { AvailableTestsCard } from '@/features/candidate-dashboard/components/AvailableTestsCard';
import { ActiveTestCard } from '@/features/candidate-dashboard/components/ActiveTestCard';
import { AttemptHistoryCard } from '@/features/candidate-dashboard/components/AttemptHistoryCard';
import { SkillProgressCard } from '@/features/candidate-dashboard/components/SkillProgressCard';
import { RecommendationsCard } from '@/features/candidate-dashboard/components/RecommendationsCard';
import { CandidateDashboardSkeleton } from '@/features/candidate-dashboard/components/CandidateDashboardSkeleton';
import { CandidateDashboardError } from '@/features/candidate-dashboard/components/CandidateDashboardError';

export default function CandidateDashboardPage() {
  const {
    availableTests,
    activeTests,
    completedAttempts,
    recommendations,
    skillProgress,
    loading,
    error,
    refetch,
  } = useCandidateDashboard();

  if (loading) {
    return <CandidateDashboardSkeleton />;
  }

  if (error) {
    return <CandidateDashboardError error={error} onRetry={refetch} />;
  }

  return (
    <div className='space-y-8 animate-fade-in-up'>
      <CandidateDashboardHeader />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Content Column */}
        <div className='lg:col-span-2 flex flex-col gap-8'>
          <ActiveTestCard tests={activeTests} />
          <AvailableTestsCard tests={availableTests} />
          <AttemptHistoryCard history={completedAttempts} />
        </div>

        {/* Sidebar Content Column */}
        <div className='flex flex-col gap-8'>
          <RecommendationsCard recommendations={recommendations} />
          <SkillProgressCard skills={skillProgress} />
        </div>
      </div>
    </div>
  );
}
