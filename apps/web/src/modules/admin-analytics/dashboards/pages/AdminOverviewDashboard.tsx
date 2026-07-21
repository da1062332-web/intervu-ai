'use client';

import { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  Users,
  Layers,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/dashboard/page-header';
import { StatCard } from '@/components/admin/dashboard/stat-card';
import { Button } from '@/components/ui/button';
import { OperationalAlertsPanel } from '../components/OperationalAlertsPanel';
import { ExportControls } from '../components/ExportControls';
import { apiClient } from '@/services/api/client';

export interface DashboardKPIs {
  totalQuestions: number;
  approvedQuestions: number;
  pendingReviews: number;
  publishedAssessments: number;
  generatedThisWeek: number;
  activeCandidates: number;
}

export function AdminOverviewDashboard() {
  const [stats, setStats] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const data = await apiClient.request<DashboardKPIs>('/admin/dashboard');
        setStats(data);
      } catch (error) {
        console.error('Failed to load KPIs:', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchKPIs();
  }, []);

  return (
    <div className='space-y-8 animate-fade-in-up pb-8'>
      {/* Page Header */}
      <PageHeader
        title='Operations Control Center'
        subtitle='Real-time intelligence and execution control across our entire assessment generation and review lifecycle.'
        action={
          <div className='flex gap-3'>
            <Button asChild className='gap-2'>
              <Link href='/admin/assembly'>
                <Layers className='size-4' />
                Test Assembly
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      {loading ? (
        <div className='flex justify-center items-center py-12'>
          <Loader2 className='size-8 animate-spin text-muted-foreground' />
        </div>
      ) : (
        <section className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'>
          <StatCard
            label='Total Questions'
            value={stats?.totalQuestions ?? 0}
            icon={<Database className='size-5' />}
            color='primary'
          />
          <StatCard
            label='Approved'
            value={stats?.approvedQuestions ?? 0}
            icon={<CheckCircle className='size-5' />}
            color='emerald'
          />
          <StatCard
            label='Pending Reviews'
            value={stats?.pendingReviews ?? 0}
            icon={<Clock className='size-5' />}
            color='amber'
          />
          <StatCard
            label='Assessments'
            value={stats?.publishedAssessments ?? 0}
            icon={<FileText className='size-5' />}
            color='blue'
          />
          <StatCard
            label='Gen This Week'
            value={stats?.generatedThisWeek ?? 0}
            icon={<Calendar className='size-5' />}
            color='primary'
          />
          <StatCard
            label='Active Candidates'
            value={stats?.activeCandidates ?? 0}
            icon={<Users className='size-5' />}
            color='emerald'
          />
        </section>
      )}



      {/* Alerts & Exports Section */}
      <section className='grid gap-6 md:grid-cols-2'>
        <OperationalAlertsPanel />
        <ExportControls />
      </section>
    </div>
  );
}
