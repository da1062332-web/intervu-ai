'use client';

import { useCandidateDashboard } from '@/features/candidate-dashboard/hooks/useCandidateDashboard';
import { CandidateDashboardHeader } from '@/components/candidate/dashboard/CandidateDashboardHeader';
import { AvailableTestsCard } from '@/components/candidate/dashboard/AvailableTestsCard';
import { ActiveTestCard } from '@/components/candidate/dashboard/ActiveTestCard';
import { AttemptHistoryCard } from '@/components/candidate/dashboard/AttemptHistoryCard';
import { SkillProgressCard } from '@/components/candidate/dashboard/SkillProgressCard';
import { RecommendationsCard } from '@/components/candidate/dashboard/RecommendationsCard';
import { CandidateDashboardSkeleton } from '@/components/candidate/dashboard/CandidateDashboardSkeleton';
import { CandidateDashboardError } from '@/components/candidate/dashboard/CandidateDashboardError';

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
