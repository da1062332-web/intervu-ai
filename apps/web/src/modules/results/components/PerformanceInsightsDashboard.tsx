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
import { ShareableResultCard } from './ShareableResultCard';
import { HiringEvaluationCard } from '@/features/candidate/results/components/HiringEvaluationCard';
import { Activity, BarChart3, Clock, Compass, Share2, Sparkles, Trophy, Lock, Zap } from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscription.store';

interface Props {
  attemptId: string;
  resultDetails?: any;
  onShareClick?: () => void;
}

export const PerformanceInsightsDashboard: React.FC<Props> = ({ attemptId, resultDetails }) => {
  const { data, isLoading, isError } = usePerformanceDashboard(attemptId);
  const entitlements = useSubscriptionStore((state) => state.entitlements);
  const openPricingModal = useSubscriptionStore((state) => state.openPricingModal);

  const rawFeats = (entitlements?.features as any) || {};
  const isProOrTeams = entitlements?.plan === 'PRO' || entitlements?.plan === 'TEAMS';
  const hasDetailedAnalytics =
    typeof rawFeats.detailedAnalytics === 'boolean'
      ? rawFeats.detailedAnalytics
      : typeof rawFeats.detailed_analytics === 'boolean'
        ? rawFeats.detailed_analytics
        : isProOrTeams;

  if (isLoading) {
    return (
      <div className='py-16 flex flex-col items-center justify-center space-y-4'>
        <Loading />
        <p className='text-xs font-semibold text-muted-foreground animate-pulse'>
          Loading comprehensive performance insights...
        </p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title='Dashboard Unavailable'
        description='Could not load the detailed performance insights for this assessment attempt.'
      />
    );
  }

  const d = data as any;
  const qual = d?.qualification || resultDetails?.qualification;
  const qualReason = d?.qualificationReason || resultDetails?.qualificationReason;
  const evalStrategy = d?.evaluationStrategy || resultDetails?.evaluationStrategy;
  const foundationScore = d?.foundationScore ?? resultDetails?.foundationScore ?? 0;
  const advancedScore = d?.advancedScore ?? resultDetails?.advancedScore ?? 0;
  const codingSolved = d?.codingSolved ?? resultDetails?.codingSolved ?? 0;
  const qualificationDetails = d?.qualificationDetails || resultDetails?.qualificationDetails;

  const isHiringEvalActive = Boolean(
    qual &&
      qual !== 'NOT_APPLICABLE' &&
      qual !== 'N/A' &&
      (evalStrategy || qualificationDetails),
  );

  return (
    <div className='space-y-10 py-2'>
      {/* SECTION 1: OVERVIEW & KPI METRICS */}
      <section className='space-y-4'>
        <div className='flex items-center gap-2 px-1 text-sm font-extrabold text-foreground tracking-tight'>
          <Trophy className='w-4 h-4 text-primary' />
          <span>Executive Performance Overview</span>
        </div>

        <div className='pdf-section'>
          <DashboardScoreCard data={data} resultDetails={resultDetails} />
        </div>

        {isHiringEvalActive && (
          <div className='pdf-section pt-2'>
            <HiringEvaluationCard
              qualification={qual}
              qualificationReason={qualReason}
              evaluationStrategy={evalStrategy || 'TCS'}
              foundationScore={foundationScore}
              advancedScore={advancedScore}
              codingSolved={codingSolved}
              qualificationDetails={qualificationDetails}
            />
          </div>
        )}
      </section>

      {/* SECTIONS 2-5: DETAILED PERFORMANCE VECTORS (PRO/TEAMS OR DETAILED ANALYTICS ENABLED) */}
      {hasDetailedAnalytics ? (
        <>
          {/* SECTION 2: PERFORMANCE VECTORS */}
          <section className='space-y-4'>
            <div className='flex items-center gap-2 px-1 text-sm font-extrabold text-foreground tracking-tight'>
              <Activity className='w-4 h-4 text-emerald-500' />
              <span>Multidimensional Competency Analysis</span>
            </div>

            <div className='pdf-section'>
              <DashboardOverallAccuracy data={data} />
            </div>

            <div className='pdf-section'>
              <DashboardCodingCard data={data} attemptId={attemptId} />
            </div>
          </section>

          {/* SECTION 3: SECTION-WISE EVALUATION TABLES */}
          <section className='space-y-4'>
            <div className='flex items-center gap-2 px-1 text-sm font-extrabold text-foreground tracking-tight'>
              <BarChart3 className='w-4 h-4 text-indigo-500' />
              <span>Section Breakdown & Scoring Details</span>
            </div>

            <div className='pdf-section'>
              <DashboardSectionAccuracy data={data} attemptId={attemptId} />
            </div>
          </section>

          {/* SECTION 4: TIME & PACING ANALYTICS */}
          <section className='space-y-4'>
            <div className='flex items-center gap-2 px-1 text-sm font-extrabold text-foreground tracking-tight'>
              <Clock className='w-4 h-4 text-blue-500' />
              <span>Time Utilization & Pacing Diagnostics</span>
            </div>

            <div className='pdf-section'>
              <DashboardSectionTime data={data} />
            </div>
          </section>

          {/* SECTION 5: AI RECOMMENDATIONS & STRATEGY */}
          <section className='space-y-4'>
            <div className='flex items-center gap-2 px-1 text-sm font-extrabold text-foreground tracking-tight'>
              <Compass className='w-4 h-4 text-amber-500' />
              <span>Personalized Improvement Strategy & Competency Breakdown</span>
            </div>

            <div className='pdf-section'>
              <DashboardStrengthWeakness data={data} attemptId={attemptId} />
            </div>

            <div className='pdf-section'>
              <DashboardRecommendations data={data} attemptId={attemptId} />
            </div>
          </section>
        </>
      ) : (
        /* FREE TIER LOCKED DETAILED ANALYTICS CTA */
        <div className='rounded-2xl border-2 border-indigo-500/20 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 dark:from-indigo-950/20 dark:via-background dark:to-purple-950/20 p-6 sm:p-8 text-center space-y-4 shadow-sm my-6'>
          <div className='inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 mb-1'>
            <Lock className='size-6' />
          </div>
          <div className='max-w-md mx-auto space-y-1.5'>
            <h3 className='text-lg sm:text-xl font-bold text-foreground'>
              Detailed Topic Analytics & Skill Radar
            </h3>
            <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
              Upgrade to Pro to unlock section-by-section accuracy, time utilization pacing diagnostics, and AI-powered weakness remediation.
            </p>
          </div>
          <div className='pt-2 flex justify-center'>
            <button
              onClick={openPricingModal}
              className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20'
            >
              <Zap className='size-4' />
              Upgrade to Pro for Detailed Insights
            </button>
          </div>
        </div>
      )}

      {/* SECTION 6: SHARE & EXPORT ACTIONS */}
      <section className='space-y-4 print:hidden' data-html2canvas-ignore='true'>
        <div className='flex items-center gap-2 px-1 text-sm font-extrabold text-foreground tracking-tight'>
          <Share2 className='w-4 h-4 text-primary' />
          <span>Shareable Report & Verification</span>
        </div>

        <div id='shareable-card-section'>
          <ShareableResultCard attemptId={attemptId} result={resultDetails} dashboardData={data} />
        </div>
      </section>
    </div>
  );
};
