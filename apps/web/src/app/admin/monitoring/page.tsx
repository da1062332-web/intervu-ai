'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Activity,
  Search,
  ArrowRight,
  Users,
  RotateCcw,
  CheckCircle2,
  Globe,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/services/api/client';

export default function LiveMonitoringOverviewPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOverview = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await apiClient.request<any>('/admin/monitoring/overview');
      setAssessments(res?.assessments || []);
    } catch (err) {
      console.error('Failed fetching monitoring overview', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const filtered = assessments.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.code?.toLowerCase().includes(search.toLowerCase()),
  );

  // Platform-wide totals across every assessment currently on this page —
  // this is the one place a "view everything" summary belongs, so the
  // "View All Candidates" action lives here once instead of being repeated
  // in the header and in a separate banner pointing at the same page.
  const platformTotals = useMemo(
    () =>
      assessments.reduce(
        (acc, a) => {
          acc.active += a.metrics?.activeCandidates || 0;
          acc.autoSubmitted += a.metrics?.autoSubmittedCandidates || 0;
          acc.submitted += a.metrics?.submittedCandidates || 0;
          return acc;
        },
        { active: 0, autoSubmitted: 0, submitted: 0 },
      ),
    [assessments],
  );

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6 pb-16'>
      <SectionHeader
        title='Live Assessment Monitoring'
        description='Real-time visibility into concurrent candidate assessments, anomaly detection, and safe state recovery.'
        icon={Activity}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Execution & Review' },
          { label: 'Live Monitoring' },
        ]}
        actions={
          <Button
            variant='outline'
            size='sm'
            onClick={() => fetchOverview(true)}
            disabled={isRefreshing}
            className='h-8 text-xs gap-1.5'
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Platform-wide summary + the single entry point into the global,
          cross-assessment view. */}
      <Card className='border-primary/20 bg-primary/5 p-4'>
        <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
          <div className='grid grid-cols-3 gap-6 sm:gap-10'>
            <div>
              <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide font-medium'>
                <Users className='size-3.5 text-emerald-500' />
                Active now
              </div>
              <p className='text-xl font-bold text-emerald-600 dark:text-emerald-400'>
                {platformTotals.active}
              </p>
            </div>
            <div>
              <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide font-medium'>
                <RotateCcw className='size-3.5 text-purple-500' />
                Auto-submitted
              </div>
              <p className='text-xl font-bold text-purple-600 dark:text-purple-400'>
                {platformTotals.autoSubmitted}
              </p>
            </div>
            <div>
              <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide font-medium'>
                <CheckCircle2 className='size-3.5 text-blue-500' />
                Submitted
              </div>
              <p className='text-xl font-bold text-blue-600 dark:text-blue-400'>
                {platformTotals.submitted}
              </p>
            </div>
          </div>

          <Link href='/admin/monitoring/all' className='shrink-0'>
            <Button size='sm' className='text-xs gap-1.5 w-full lg:w-auto'>
              <Globe className='size-3.5' />
              View All Candidates
              <ArrowRight className='size-3.5' />
            </Button>
          </Link>
        </div>
      </Card>

      <div className='flex items-center justify-between gap-4'>
        <div className='relative max-w-md flex-1'>
          <Search className='absolute left-3 top-2.5 size-4 text-muted-foreground' />
          <Input
            placeholder='Search active assessments by name or code...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9 h-9 text-xs'
          />
        </div>
      </div>

      {loading ? (
        <div className='space-y-2.5'>
          {[...Array(6)].map((_, i) => (
            <Card key={`overview-skeleton-${i}`} className='animate-pulse p-4'>
              <div className='flex items-center gap-4'>
                <div className='space-y-1.5 flex-1'>
                  <div className='h-4 bg-muted rounded w-1/3' />
                  <div className='h-3 bg-muted/60 rounded w-1/4' />
                </div>
                <div className='h-8 bg-muted rounded w-64 hidden sm:block' />
                <div className='h-8 bg-muted rounded w-40' />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className='p-8 text-center text-xs text-muted-foreground'>
          {assessments.length === 0
            ? 'No assessments are currently active.'
            : 'No assessments found matching your search.'}
        </Card>
      ) : (
        <div className='space-y-2.5'>
          {filtered.map((a) => (
            <Card
              key={a.id}
              className='hover:shadow-md transition-shadow border p-4 flex flex-col lg:flex-row lg:items-center gap-4'
            >
              {/* Name & meta */}
              <div className='min-w-0 lg:flex-1 space-y-1'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <CardTitle className='text-sm font-semibold'>{a.name}</CardTitle>
                  <Badge variant='outline' className='text-[10px] font-mono shrink-0'>
                    {a.code}
                  </Badge>
                </div>
                <CardDescription className='text-xs'>
                  {a.durationMinutes} min • {a.totalQuestions} questions
                </CardDescription>
              </div>

              {/* Stats */}
              <div className='flex items-center gap-5 sm:gap-8 px-1 shrink-0'>
                <div className='text-center'>
                  <span className='text-[11px] text-muted-foreground block'>Active</span>
                  <span className='font-bold text-sm text-emerald-600 dark:text-emerald-400'>
                    {a.metrics?.activeCandidates || 0}
                  </span>
                </div>
                <div className='text-center'>
                  <span className='text-[11px] text-muted-foreground block'>Auto-Submitted</span>
                  <span className='font-bold text-sm text-purple-600 dark:text-purple-400'>
                    {a.metrics?.autoSubmittedCandidates || 0}
                  </span>
                </div>
                <div className='text-center'>
                  <span className='text-[11px] text-muted-foreground block'>Done</span>
                  <span className='font-bold text-sm text-foreground'>
                    {a.metrics?.submittedCandidates || 0}
                  </span>
                </div>
              </div>

              {/* Action */}
              <Link
                href={`/admin/monitoring/${a.id}?name=${encodeURIComponent(a.name || '')}`}
                className='block shrink-0'
              >
                <Button size='sm' className='w-full lg:w-auto text-xs gap-1.5 h-8'>
                  <Activity className='size-3.5' />
                  View Live Monitoring
                  <ArrowRight className='size-3.5' />
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
