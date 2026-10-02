'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Calendar,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/services/api/client';

export default function LiveMonitoringOverviewPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'custom' | 'all'>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchOverview = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.set('dateFilter', dateFilter);
      if (dateFilter === 'custom' && startDate) params.set('startDate', startDate);
      if (dateFilter === 'custom' && endDate) params.set('endDate', endDate);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.request<any>(`/admin/monitoring/overview${queryStr}`);
      setAssessments(res?.assessments || []);
    } catch (err) {
      console.error('Failed fetching monitoring overview', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [dateFilter, startDate, endDate]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const filtered = assessments.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.code?.toLowerCase().includes(search.toLowerCase()),
  );

  // Platform-wide totals across every assessment currently on this page
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

  const queryParamsString = useMemo(() => {
    const params = new URLSearchParams();
    if (dateFilter) params.set('dateFilter', dateFilter);
    if (dateFilter === 'custom' && startDate) params.set('startDate', startDate);
    if (dateFilter === 'custom' && endDate) params.set('endDate', endDate);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [dateFilter, startDate, endDate]);

  const viewAllHref = `/admin/monitoring/all${queryParamsString}`;

  const getAssessmentHref = (a: any) => {
    const params = new URLSearchParams();
    if (a.name) params.set('name', a.name);
    if (dateFilter) params.set('dateFilter', dateFilter);
    if (dateFilter === 'custom' && startDate) params.set('startDate', startDate);
    if (dateFilter === 'custom' && endDate) params.set('endDate', endDate);
    return `/admin/monitoring/${a.id}?${params.toString()}`;
  };

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

      {/* Time Horizon Filter Toolbar + Platform Summary */}
      <div className='space-y-4'>
        {/* Horizon Filter Bar */}
        <div className='flex flex-wrap items-center justify-between gap-3 bg-card border rounded-lg p-3 shadow-sm'>
          <div className='flex flex-wrap items-center gap-2.5'>
            <div className='flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider'>
              <Calendar className='size-4 text-primary' />
              <span>Time Horizon:</span>
            </div>
            <div className='inline-flex rounded-md border bg-muted/40 p-0.5 text-xs'>
              <Button
                variant={dateFilter === 'today' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setDateFilter('today')}
                className='h-7 px-3 text-xs rounded-sm'
              >
                Today
              </Button>
              <Button
                variant={dateFilter === 'yesterday' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setDateFilter('yesterday')}
                className='h-7 px-3 text-xs rounded-sm'
              >
                Yesterday
              </Button>
              <Button
                variant={dateFilter === 'custom' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setDateFilter('custom')}
                className='h-7 px-3 text-xs rounded-sm'
              >
                Custom Date
              </Button>
              <Button
                variant={dateFilter === 'all' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setDateFilter('all')}
                className='h-7 px-3 text-xs rounded-sm'
              >
                All Time
              </Button>
            </div>
          </div>

          {dateFilter === 'custom' && (
            <div className='flex items-center gap-2 animate-in fade-in duration-200'>
              <div className='flex items-center gap-1.5'>
                <span className='text-xs text-muted-foreground font-medium'>From:</span>
                <Input
                  type='date'
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className='h-7 text-xs w-36 px-2'
                />
              </div>
              <div className='flex items-center gap-1.5'>
                <span className='text-xs text-muted-foreground font-medium'>To:</span>
                <Input
                  type='date'
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className='h-7 text-xs w-36 px-2'
                />
              </div>
            </div>
          )}

          <div className='text-xs text-muted-foreground font-medium flex items-center gap-1.5 ml-auto'>
            <Clock className='size-3.5 text-muted-foreground/70' />
            <span>
              {dateFilter === 'today'
                ? "Showing today's platform activity"
                : dateFilter === 'yesterday'
                ? "Showing yesterday's platform activity"
                : dateFilter === 'custom'
                ? startDate || endDate
                  ? `Showing activity from ${startDate || 'start'} to ${endDate || 'now'}`
                  : 'Select custom date range'
                : 'Showing all-time platform activity'}
            </span>
          </div>
        </div>

        {/* Platform-wide summary card */}
        <Card className='border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5 p-4 sm:p-5 shadow-sm'>
          <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-5'>
            <div className='grid grid-cols-3 gap-6 sm:gap-12'>
              <div>
                <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide font-medium'>
                  <Users className='size-3.5 text-emerald-500' />
                  Active now
                </div>
                <div className='flex items-baseline gap-2 mt-1'>
                  <p className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
                    {platformTotals.active}
                  </p>
                  {platformTotals.active > 0 && (
                    <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
                  )}
                </div>
              </div>
              <div>
                <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide font-medium'>
                  <RotateCcw className='size-3.5 text-purple-500' />
                  Auto-submitted
                </div>
                <div className='flex items-baseline gap-2 mt-1'>
                  <p className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
                    {platformTotals.autoSubmitted}
                  </p>
                </div>
              </div>
              <div>
                <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide font-medium'>
                  <CheckCircle2 className='size-3.5 text-blue-500' />
                  Submitted
                </div>
                <div className='flex items-baseline gap-2 mt-1'>
                  <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                    {platformTotals.submitted}
                  </p>
                </div>
              </div>
            </div>

            <Link href={viewAllHref} className='shrink-0'>
              <Button size='sm' className='text-xs gap-1.5 w-full lg:w-auto shadow-sm'>
                <Globe className='size-3.5' />
                View All Candidates
                <ArrowRight className='size-3.5' />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

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
                href={getAssessmentHref(a)}
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
