'use client';

import React, { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Activity,
  Search,
  ArrowRight,
  Users,
  RotateCcw,
  Clock,
  CheckCircle2,
  Zap,
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

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6 pb-16'>
      <SectionHeader
        title='Live Assessment Monitoring'
        description='Real-time surveillance operations center for 100+ concurrent candidate assessments, anomaly detection, and safe state recovery.'
        icon={Activity}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Execution & Review' },
          { label: 'Live Monitoring' },
        ]}
        actions={
          <div className='flex items-center gap-2'>
            <Link href='/admin/monitoring/all'>
              <Button size='sm' className='h-8 text-xs gap-1.5'>
                <Activity className='size-3.5' />
                Monitor All Live Candidates
              </Button>
            </Link>
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
          </div>
        }
      />

      {/* Global Live Operations Banner */}
      <Card className='border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <Badge variant='default' className='text-[10px] font-mono'>
              GLOBAL VIEW
            </Badge>
            <h3 className='text-sm font-semibold text-foreground'>
              All Active Assessments Live Operations
            </h3>
          </div>
          <p className='text-xs text-muted-foreground'>
            Simultaneously surveil candidates across all assessments platform-wide with real-time telemetry, anomaly alerts, and Today/Yesterday/Custom date filtering.
          </p>
        </div>
        <Link href='/admin/monitoring/all'>
          <Button size='sm' className='text-xs gap-1.5 shrink-0'>
            <Activity className='size-3.5' />
            Launch Global Operations Center
            <ArrowRight className='size-3.5' />
          </Button>
        </Link>
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
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {[...Array(6)].map((_, i) => (
            <Card key={`overview-skeleton-${i}`} className='animate-pulse p-4 space-y-4 border'>
              <div className='flex items-start justify-between gap-2'>
                <div className='space-y-1.5 flex-1'>
                  <div className='h-4 bg-muted rounded w-3/4' />
                  <div className='h-3 bg-muted/60 rounded w-1/2' />
                </div>
                <div className='h-5 w-14 bg-muted rounded' />
              </div>
              <div className='grid grid-cols-3 gap-2 p-2.5 bg-muted/40 rounded-lg'>
                <div className='h-8 bg-muted rounded' />
                <div className='h-8 bg-muted rounded' />
                <div className='h-8 bg-muted rounded' />
              </div>
              <div className='h-8 bg-muted rounded w-full' />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className='p-8 text-center text-xs text-muted-foreground'>
          No assessments found matching search.
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filtered.map((a) => (
            <Card
              key={a.id}
              className='hover:shadow-md transition-shadow border flex flex-col justify-between'
            >
              <CardHeader className='p-4 pb-2 space-y-1'>
                <div className='flex items-start justify-between gap-2'>
                  <CardTitle className='text-sm font-semibold truncate'>{a.name}</CardTitle>
                  <Badge variant='outline' className='text-[10px] font-mono shrink-0'>
                    {a.code}
                  </Badge>
                </div>
                <CardDescription className='text-xs'>
                  {a.durationMinutes} min • {a.totalQuestions} questions
                </CardDescription>
              </CardHeader>

              <CardContent className='p-4 pt-2 space-y-3'>
                <div className='grid grid-cols-3 gap-2 p-2.5 bg-muted/40 rounded-lg text-center'>
                  <div>
                    <span className='text-[11px] text-muted-foreground block'>Active</span>
                    <span className='font-bold text-sm text-emerald-600 dark:text-emerald-400'>
                      {a.metrics?.activeCandidates || 0}
                    </span>
                  </div>
                  <div>
                    <span className='text-[11px] text-muted-foreground block'>Attention</span>
                    <span className='font-bold text-sm text-purple-600 dark:text-purple-400'>
                      {a.metrics?.autoSubmittedCandidates || 0}
                    </span>
                  </div>
                  <div>
                    <span className='text-[11px] text-muted-foreground block'>Done</span>
                    <span className='font-bold text-sm text-foreground'>
                      {a.metrics?.submittedCandidates || 0}
                    </span>
                  </div>
                </div>

                <Link href={`/admin/monitoring/${a.id}`} className='block'>
                  <Button size='sm' className='w-full text-xs gap-1.5 h-8'>
                    <Activity className='size-3.5' />
                    Launch Operations Center
                    <ArrowRight className='size-3.5 ml-auto' />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
