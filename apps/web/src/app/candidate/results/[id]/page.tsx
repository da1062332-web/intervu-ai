'use client';

import { useParams } from 'next/navigation';
import { useResults } from '@/features/candidate/results/hooks/useResults';
import { ResultsHeader } from '@/features/candidate/results/components/ResultsHeader';
import { OverallScoreCard } from '@/features/candidate/results/components/OverallScoreCard';
import { SkillBreakdownCard } from '@/features/candidate/results/components/SkillBreakdownCard';
import { StrengthCard } from '@/features/candidate/results/components/StrengthCard';
import { WeaknessCard } from '@/features/candidate/results/components/WeaknessCard';
import { RecommendationCard } from '@/features/candidate/results/components/RecommendationCard';
import { PerformanceSummaryCard } from '@/features/candidate/results/components/PerformanceSummaryCard';
import { ResultsSkeleton } from '@/features/candidate/results/components/ResultsSkeleton';
import { ResultsError } from '@/features/candidate/results/components/ResultsError';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ResultsPage() {
  const params = useParams();
  const id = params?.id as string;

  const {
    evaluation,
    skills,
    recommendations,
    performanceSummary,
    strengths,
    weaknesses,
    loading,
    error
  } = useResults(id);

  if (loading) return <ResultsSkeleton />;
  if (error) return <ResultsError error={error} />;
  if (!evaluation) return <ResultsError error="Evaluation data not found." />;

  return (
    <div className="min-h-screen bg-background flex flex-col pt-6 md:pt-8 pb-12">
      <main className="flex-1 container max-w-7xl mx-auto px-4 md:px-8">
        
        <ResultsHeader evaluation={evaluation} />

        <div className="mb-8">
          <OverallScoreCard evaluation={evaluation} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <SkillBreakdownCard skills={skills} />
            <RecommendationCard recommendations={recommendations} />
          </div>

          {/* Right Column - Strengths & Weaknesses */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <StrengthCard strengths={strengths} />
            <WeaknessCard weaknesses={weaknesses} />
          </div>
        </div>

        <div className="mb-8">
          {performanceSummary && <PerformanceSummaryCard summary={performanceSummary} />}
        </div>

        <div className="flex justify-center mt-12">
          <Button asChild size="lg" className="min-w-[200px]">
            <Link href="/candidate/dashboard">Return to Dashboard</Link>
          </Button>
        </div>

      </main>
    </div>
  );
}
