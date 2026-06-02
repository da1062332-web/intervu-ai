'use client';

import {
  Plus,
  ClipboardList,
  BarChart3,
  Users,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/store/auth.store';
import { useDashboardStats } from '@/modules/dashboard';
import { PageHeader } from '@/components/dashboard/page-header';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { StatCard } from '@/components/dashboard/stat-card';
import { EmptyStateCard } from '@/components/dashboard/empty-state';
import { SkeletonCardGrid } from '@/components/dashboard/skeleton-card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { data: stats, isLoading } = useDashboardStats();

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <PageHeader
        title={`Welcome back, ${firstName} 👋`}
        subtitle="Here's what's happening with your interview assessments today."
        action={
          <Button
            onClick={() => router.push('/tests')}
            className="gap-2"
            id="create-assessment-btn"
          >
            <Plus className="size-4" />
            New Assessment
          </Button>
        }
      />

      {/* ── Stat Cards ── */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Key metrics
        </h2>
        {isLoading ? (
          <SkeletonCardGrid count={4} variant="stat" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Assessments"
              value={stats?.totalAssessments ?? 0}
              trend="neutral"
              trendLabel="No change"
              icon={<ClipboardList className="size-5" />}
              color="primary"
            />
            <StatCard
              label="Active Tests"
              value={stats?.activeTests ?? 0}
              trend="neutral"
              trendLabel="No change"
              icon={<Clock className="size-5" />}
              color="blue"
            />
            <StatCard
              label="Completed Results"
              value={stats?.completedResults ?? 0}
              trend="neutral"
              trendLabel="No change"
              icon={<BarChart3 className="size-5" />}
              color="emerald"
            />
            <StatCard
              label="Candidates Passed"
              value={stats?.candidatesPassed ?? 0}
              trend="neutral"
              trendLabel="No change"
              icon={<Users className="size-5" />}
              color="amber"
            />
          </div>
        )}
      </section>

      {/* ── Quick Actions ── */}
      <section aria-labelledby="quick-actions-heading">
        <h2
          id="quick-actions-heading"
          className="text-lg font-heading font-semibold text-foreground mb-4"
        >
          Quick Actions
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            title="Create Assessment"
            description="Build a new AI-powered interview assessment tailored to your specific role and requirements."
            icon={<Plus className="size-6" />}
            actionLabel="Get Started"
            onAction={() => router.push('/tests')}
            color="primary"
          />
          <DashboardCard
            title="Browse Tests"
            description="View and manage all your interview assessments, candidates, and test configurations."
            icon={<ClipboardList className="size-6" />}
            actionLabel="View Tests"
            onAction={() => router.push('/tests')}
            color="blue"
          >
            <EmptyStateCard
              title="No tests yet"
              compact
              cardClassName="min-h-[60px]"
            />
          </DashboardCard>
          <DashboardCard
            title="Analytics"
            description="Gain deep insights into candidate performance, pass rates, and hiring metrics."
            icon={<TrendingUp className="size-6" />}
            actionLabel="View Analytics"
            onAction={() => router.push('/results')}
            color="emerald"
          >
            <EmptyStateCard
              title="No data yet"
              compact
              cardClassName="min-h-[60px]"
            />
          </DashboardCard>
        </div>
      </section>
    </div>
  );
}
