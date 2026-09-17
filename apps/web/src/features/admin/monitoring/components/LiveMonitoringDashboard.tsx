'use client';

import React, { useState } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Activity, RefreshCw, ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useLiveMonitoring, CandidateItem } from '../hooks/useLiveMonitoring';
import { SystemHealthRibbon } from './SystemHealthRibbon';
import { NeedsAttentionQueue } from './NeedsAttentionQueue';
import { AlertCenter } from './AlertCenter';
import { CandidateLiveTable } from './CandidateLiveTable';
import { CandidateDetailDrawer } from './CandidateDetailDrawer';
import { RecoveryCenterModal } from './RecoveryCenterModal';

interface LiveMonitoringDashboardProps {
  assessmentId: string;
}

export function LiveMonitoringDashboard({ assessmentId }: LiveMonitoringDashboardProps) {
  const isGlobalAll = assessmentId === 'all';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'custom' | 'all'>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [recoveryCandidate, setRecoveryCandidate] = useState<CandidateItem | null>(null);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  const {
    candidates,
    summary,
    alerts,
    systemHealth,
    pagination,
    isLoading,
    isRefetching,
    isConnected,
    refetch,
  } = useLiveMonitoring(assessmentId, {
    search,
    status: statusFilter === 'ATTENTION' ? undefined : statusFilter,
    attentionOnly: statusFilter === 'ATTENTION' || attentionOnly,
    dateFilter,
    startDate: dateFilter === 'custom' && startDate ? startDate : undefined,
    endDate: dateFilter === 'custom' && endDate ? endDate : undefined,
    page,
    limit: 50,
  });

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleInspect = (candidate: CandidateItem) => {
    setSelectedCandidate(candidate);
    setIsDetailOpen(true);
  };

  const handleOpenRecovery = (candidate: CandidateItem) => {
    setRecoveryCandidate(candidate);
    setIsRecoveryOpen(true);
  };

  return (
    <div className='container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6 pb-16'>
      {/* Header */}
      <SectionHeader
        title={
          isGlobalAll
            ? 'Global Live Assessment Operations Center'
            : 'Live Assessment Operations Center'
        }
        description={
          isGlobalAll
            ? 'Real-time multi-assessment surveillance across all candidates platform-wide.'
            : 'Real-time concurrent candidate monitoring, automated anomaly detection, and safe state recovery.'
        }
        icon={Activity}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Live Monitoring', href: '/admin/monitoring' },
          {
            label: isGlobalAll
              ? 'All Assessments (Global View)'
              : `Assessment (${assessmentId})`,
          },
        ]}
        actions={
          <div className='flex items-center gap-2'>
            {isConnected ? (
              <Badge
                variant='outline'
                className='h-8 px-2.5 text-[11px] gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 font-medium'
              >
                <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
                LIVE SSE
              </Badge>
            ) : (
              <Badge
                variant='outline'
                className='h-8 px-2.5 text-[11px] gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 font-medium'
              >
                <span className='size-2 rounded-full bg-amber-500' />
                POLLING (5s)
              </Badge>
            )}
            <Button
              variant='outline'
              size='sm'
              onClick={() => refetch()}
              disabled={isRefetching}
              className='h-8 text-xs gap-1.5'
            >
              <RefreshCw className={`size-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              Resync
            </Button>
            <Link href='/admin/monitoring'>
              <Button variant='secondary' size='sm' className='h-8 text-xs gap-1.5'>
                <ArrowLeft className='size-3.5' />
                Overview
              </Button>
            </Link>
          </div>
        }
      />

      {/* Date Horizon Filter Toolbar */}
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
              onClick={() => {
                setDateFilter('today');
                setPage(1);
              }}
              className='h-7 px-3 text-xs rounded-sm'
            >
              Today
            </Button>
            <Button
              variant={dateFilter === 'yesterday' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => {
                setDateFilter('yesterday');
                setPage(1);
              }}
              className='h-7 px-3 text-xs rounded-sm'
            >
              Yesterday
            </Button>
            <Button
              variant={dateFilter === 'custom' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => {
                setDateFilter('custom');
                setPage(1);
              }}
              className='h-7 px-3 text-xs rounded-sm'
            >
              Custom Date
            </Button>
            <Button
              variant={dateFilter === 'all' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => {
                setDateFilter('all');
                setPage(1);
              }}
              className='h-7 px-3 text-xs rounded-sm'
            >
              All Time
            </Button>
          </div>
        </div>

        {dateFilter === 'custom' && (
          <div className='flex items-center gap-2 animate-in fade-in duration-200'>
            <div className='flex items-center gap-1.5'>
              <span className='text-[11px] text-muted-foreground'>From:</span>
              <Input
                type='date'
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className='h-7 w-36 text-xs px-2'
              />
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='text-[11px] text-muted-foreground'>To:</span>
              <Input
                type='date'
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className='h-7 w-36 text-xs px-2'
              />
            </div>
          </div>
        )}

        <div className='flex items-center gap-2 ml-auto text-xs text-muted-foreground'>
          <Badge variant='outline' className='text-[11px] capitalize font-medium'>
            {dateFilter === 'today'
              ? "Today's Cohort"
              : dateFilter === 'yesterday'
                ? "Yesterday's Cohort"
                : dateFilter === 'custom'
                  ? 'Custom Period'
                  : 'All-Time Cohort'}
          </Badge>
          <span>
            <strong className='text-foreground'>{summary?.total || 0}</strong> candidates
          </span>
        </div>
      </div>

      {/* System Health & Metric Cards */}
      <SystemHealthRibbon
        summary={summary}
        health={systemHealth}
        isConnected={isConnected}
        onFilterStatus={handleStatusFilter}
        activeStatusFilter={statusFilter}
      />

      {/* Needs Attention Priority Queue */}
      <NeedsAttentionQueue
        candidates={candidates}
        onSelectCandidate={handleInspect}
        onOpenRecovery={handleOpenRecovery}
      />

      {/* Centralized Alert Center */}
      <AlertCenter alerts={alerts} onAlertResolved={() => refetch()} />

      {/* Candidate Live Monitoring Table */}
      <CandidateLiveTable
        candidates={candidates}
        pagination={pagination}
        onPageChange={setPage}
        onSearchChange={(q) => {
          setSearch(q);
          setPage(1);
        }}
        onStatusFilterChange={handleStatusFilter}
        onSortChange={() => {}}
        onSelectCandidate={handleInspect}
        onOpenRecovery={handleOpenRecovery}
        activeStatusFilter={statusFilter}
        searchQuery={search}
        isLoading={isLoading}
      />

      {/* 9-Tab Candidate Detail Drawer */}
      <CandidateDetailDrawer
        candidate={selectedCandidate}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onOpenRecovery={handleOpenRecovery}
      />

      {/* Safe Recovery Center Modal */}
      <RecoveryCenterModal
        candidate={recoveryCandidate}
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        onRecoveryComplete={() => refetch()}
      />
    </div>
  );
}
