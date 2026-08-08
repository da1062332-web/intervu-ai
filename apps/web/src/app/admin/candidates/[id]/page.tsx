'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, BarChart2, History, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { useCandidate } from '@/features/admin/candidates/hooks/useCandidate';
import { useCandidateStats } from '@/features/admin/candidates/hooks/useCandidateStats';
import { useCandidateTests } from '@/features/admin/candidates/hooks/useCandidateTests';
import { CandidateProfileCard } from '@/features/admin/candidates/components/CandidateProfileCard';
import { CandidateStatsCards } from '@/features/admin/candidates/components/CandidateStatsCards';
import { CandidateHistoryTable } from '@/features/admin/candidates/components/CandidateHistoryTable';
import { CandidateEmptyState } from '@/features/admin/candidates/components/CandidateEmptyState';

export default function AdminCandidateDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = Array.isArray(params?.id) ? params.id[0] : params?.id || '';
  const [testPage, setTestPage] = React.useState(1);

  const {
    data: candidate,
    isLoading: isCandidateLoading,
    error: candidateError,
    refetch: refetchCandidate,
  } = useCandidate(candidateId);

  const {
    data: stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useCandidateStats(candidateId);

  const {
    data: testHistory,
    isLoading: isTestsLoading,
    refetch: refetchTests,
  } = useCandidateTests(candidateId, { page: testPage, limit: 10 });

  const handleRefresh = () => {
    refetchCandidate();
    refetchStats();
    refetchTests();
  };

  if (candidateError) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6'>
        <Button variant='ghost' onClick={() => router.push('/admin/candidates')} className='mb-4'>
          <ArrowLeft className='w-4 h-4 mr-2' />
          Back to Candidates
        </Button>
        <CandidateEmptyState
          error={candidateError}
          title='Candidate Not Found'
          description='We were unable to load profile details for this candidate ID.'
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8'>
      <div className='flex items-center justify-between mb-2'>
        <Button
          variant='ghost'
          onClick={() => router.push('/admin/candidates')}
          className='text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='w-4 h-4 mr-2' />
          Back to Candidate List
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={handleRefresh}
          className='flex items-center gap-2'
        >
          <RefreshCw className='w-3.5 h-3.5' />
          Refresh Data
        </Button>
      </div>

      <SectionHeader
        title={
          candidate?.name ? `${candidate.name} - Profile & Metrics` : 'Candidate Profile & Metrics'
        }
        description='Comprehensive audit of candidate performance, evaluation statistics, and assessment history.'
        icon={User}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Candidates', href: '/admin/candidates' },
          { label: candidate?.name || 'Details' },
        ]}
      />

      <section className='space-y-4'>
        <CandidateProfileCard candidate={candidate} isLoading={isCandidateLoading} />
      </section>

      <section className='space-y-4 pt-2'>
        <div className='flex items-center gap-2 pb-1 border-b border-border/40'>
          <BarChart2 className='w-5 h-5 text-primary' />
          <h3 className='text-lg font-bold text-foreground'>Assessment Performance Metrics</h3>
        </div>
        <CandidateStatsCards stats={stats} isLoading={isStatsLoading || isCandidateLoading} />
      </section>

      <section className='space-y-4 pt-2'>
        <div className='flex items-center justify-between pb-1 border-b border-border/40'>
          <div className='flex items-center gap-2'>
            <History className='w-5 h-5 text-primary' />
            <h3 className='text-lg font-bold text-foreground'>Test Assessment History</h3>
          </div>
        </div>
        <CandidateHistoryTable
          history={testHistory?.items ?? []}
          pagination={testHistory?.pagination}
          onPageChange={(p) => setTestPage(p)}
          isLoading={isTestsLoading || isCandidateLoading}
        />
      </section>
    </div>
  );
}
