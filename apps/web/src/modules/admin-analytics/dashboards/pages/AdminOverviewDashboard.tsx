'use client';

import { CheckCircle, Users, FileText, Activity, Library } from 'lucide-react';
import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { useDashboardKPIs } from '../../hooks/useDashboardKPIs';
import { AssessmentCompletionWidget } from '../components/AssessmentCompletionWidget';
import { RecentAssessmentsTable } from '../components/RecentAssessmentsTable';
import { RecentTestAttemptsTable } from '../components/RecentTestAttemptsTable';

export function AdminOverviewDashboard() {
  const { data, isLoading, isError, loadingStates } = useDashboardKPIs();

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8 animate-fade-in-up pb-8'>
      {/* Page Header */}
      <SectionHeader
        title='Operations Control Center'
        description='Real-time intelligence and execution control across our entire assessment generation and review lifecycle.'
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          <div className='flex gap-3'>
            <Button asChild className='gap-2'>
              <Link href='/admin/assembly'>
                <Activity className='size-4' />
                Test Assembly
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <section className='grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'>
        <StatCard
          title='Published Assessments'
          value={data.activeAssessments ?? data.totalAssessments ?? 0}
          icon={<FileText className='size-5' />}
          isLoading={loadingStates?.activeAssessments ?? isLoading}
        />
        <StatCard
          title='Active Candidates'
          value={data.totalCandidates ?? 0}
          icon={<Users className='size-5' />}
          isLoading={loadingStates?.totalCandidates ?? isLoading}
        />
        <StatCard
          title='Completed Tests'
          value={data.completedTests ?? 0}
          icon={<CheckCircle className='size-5' />}
          isLoading={loadingStates?.completedTests ?? isLoading}
        />
        <StatCard
          title='Average Score'
          value={data.averageScore ? `${data.averageScore}/100` : '0/100'}
          icon={<Activity className='size-5' />}
          isLoading={loadingStates?.averageScore ?? isLoading}
        />
        <StatCard
          title='Question Bank Count'
          value={data.questionBankCount ?? 0}
          icon={<Library className='size-5' />}
          isLoading={loadingStates?.questionBankCount ?? isLoading}
        />
      </section>

      {/* Grid: Completion Widget + Recent Assessments Table */}
      <section className='grid gap-6 md:grid-cols-1 lg:grid-cols-5 items-stretch'>
        <div className='lg:col-span-2 flex flex-col'>
          <AssessmentCompletionWidget />
        </div>
        <div className='lg:col-span-3 flex flex-col'>
          <RecentAssessmentsTable />
        </div>
      </section>

      {/* Recent Test Attempts Table Section */}
      <section>
        <RecentTestAttemptsTable />
      </section>
    </div>
  );
}
