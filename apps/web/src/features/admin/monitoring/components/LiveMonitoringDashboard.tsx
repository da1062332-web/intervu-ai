'use client';

import React, { useState, useMemo } from 'react';
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
import { BulkActionBar } from './BulkActionBar';
import { apiClient } from '@/services/api/client';
import { toast } from 'sonner';

interface LiveMonitoringDashboardProps {
  assessmentId: string;
  assessmentName?: string;
}

export function LiveMonitoringDashboard({ assessmentId, assessmentName }: LiveMonitoringDashboardProps) {
  const isGlobalAll = assessmentId === 'all';
  const shortId = assessmentId.length > 10 ? `${assessmentId.slice(0, 8)}…` : assessmentId;
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

  // Multi-selection state for bulk operations
  const [selectedAttemptIds, setSelectedAttemptIds] = useState<Set<string>>(new Set());
  const [isBulkActing, setIsBulkActing] = useState(false);

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

  // Selection handlers
  const handleToggleSelect = (attemptId: string) => {
    setSelectedAttemptIds((prev) => {
      const next = new Set(prev);
      if (next.has(attemptId)) {
        next.delete(attemptId);
      } else {
        next.add(attemptId);
      }
      return next;
    });
  };

  const handleSelectMultiple = (ids: string[]) => {
    setSelectedAttemptIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleDeselectMultiple = (ids: string[]) => {
    setSelectedAttemptIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    const ids = candidates.map((c) => c.attemptId);
    setSelectedAttemptIds(new Set(ids));
  };

  const handleClearSelection = () => {
    setSelectedAttemptIds(new Set());
  };

  // Bulk Actions
  const handleBulkExtendTime = async (attemptIdsOrMinutes: string[] | number, minutesParam?: number) => {
    let ids: string[];
    let extraMinutes: number;

    if (Array.isArray(attemptIdsOrMinutes)) {
      ids = attemptIdsOrMinutes;
      extraMinutes = minutesParam || 10;
    } else {
      ids = Array.from(selectedAttemptIds);
      extraMinutes = attemptIdsOrMinutes;
    }

    if (ids.length === 0) return;

    setIsBulkActing(true);
    try {
      const res = await apiClient.request<{ succeeded: number; failed: number; total: number }>(
        '/admin/monitoring/bulk/extend-time',
        {
          method: 'POST',
          body: { attemptIds: ids, extraMinutes, reason: `Bulk +${extraMinutes}m proctor extension` },
        },
      );
      if (res.succeeded > 0) {
        toast.success(`Granted +${extraMinutes}m to ${res.succeeded} candidate${res.succeeded > 1 ? 's' : ''}`);
      }
      if (res.failed > 0) {
        toast.error(`Failed to extend time for ${res.failed} candidate${res.failed > 1 ? 's' : ''}`);
      }
      handleClearSelection();
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to execute bulk time extension');
    } finally {
      setIsBulkActing(false);
    }
  };

  const handleBulkRecover = async (attemptIdsParam?: string[], graceMinutes = 5) => {
    const ids = attemptIdsParam && attemptIdsParam.length > 0 ? attemptIdsParam : Array.from(selectedAttemptIds);
    if (ids.length === 0) return;

    setIsBulkActing(true);
    try {
      const res = await apiClient.request<{ succeeded: number; failed: number; total: number }>(
        '/admin/monitoring/bulk/recover',
        {
          method: 'POST',
          body: { attemptIds: ids, extraTimeMinutes: graceMinutes, reason: 'Bulk admin recovery authorization' },
        },
      );
      if (res.succeeded > 0) {
        toast.success(`Authorized resume (+${graceMinutes}m) for ${res.succeeded} candidate${res.succeeded > 1 ? 's' : ''}`);
      }
      if (res.failed > 0) {
        toast.error(`Could not resume ${res.failed} candidate${res.failed > 1 ? 's' : ''} (not in recoverable state)`);
      }
      handleClearSelection();
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to execute bulk recovery');
    } finally {
      setIsBulkActing(false);
    }
  };

  const handleBulkForceSubmit = async (attemptIdsParam?: string[]) => {
    const ids = attemptIdsParam && attemptIdsParam.length > 0 ? attemptIdsParam : Array.from(selectedAttemptIds);
    if (ids.length === 0) return;

    setIsBulkActing(true);
    try {
      const res = await apiClient.request<{ succeeded: number; failed: number; total: number }>(
        '/admin/monitoring/bulk/force-submit',
        {
          method: 'POST',
          body: { attemptIds: ids, reason: 'Bulk administrative force submit' },
        },
      );
      if (res.succeeded > 0) {
        toast.success(`Force-submitted ${res.succeeded} attempt${res.succeeded > 1 ? 's' : ''}`);
      }
      if (res.failed > 0) {
        toast.error(`Failed to force-submit ${res.failed} attempt${res.failed > 1 ? 's' : ''}`);
      }
      handleClearSelection();
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to execute bulk force submit');
    } finally {
      setIsBulkActing(false);
    }
  };

  const handleBulkDelete = async (attemptIdsParam?: string[]) => {
    const ids = attemptIdsParam && attemptIdsParam.length > 0 ? attemptIdsParam : Array.from(selectedAttemptIds);
    if (ids.length === 0) return;

    setIsBulkActing(true);
    try {
      const res = await apiClient.request<{ succeeded: number; failed: number; total: number }>(
        '/admin/monitoring/bulk/delete',
        {
          method: 'POST',
          body: { attemptIds: ids },
        },
      );
      if (res.succeeded > 0) {
        toast.success(`Deleted ${res.succeeded} attempt${res.succeeded > 1 ? 's' : ''}`);
      }
      if (res.failed > 0) {
        toast.error(`Failed to delete ${res.failed} attempt${res.failed > 1 ? 's' : ''} (still live or already removed)`);
      }
      handleClearSelection();
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to execute bulk delete');
    } finally {
      setIsBulkActing(false);
    }
  };

  const liveSelectedCandidate = useMemo(() => {
    if (!selectedCandidate) return null;
    return candidates.find((c) => c.attemptId === selectedCandidate.attemptId) || selectedCandidate;
  }, [candidates, selectedCandidate]);

  return (
    <div className='container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6 pb-24'>
      {/* Header */}
      <SectionHeader
        title={isGlobalAll ? 'All Assessments — Live Monitoring' : assessmentName || 'Live Monitoring'}
        description={
          isGlobalAll
            ? 'Real-time monitoring across every active assessment, platform-wide.'
            : 'Real-time candidate monitoring, anomaly detection, and safe state recovery for this assessment.'
        }
        icon={Activity}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Live Monitoring', href: '/admin/monitoring' },
          {
            label: isGlobalAll ? 'All Assessments' : assessmentName || shortId,
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
              Refresh
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
        selectedAttemptIds={selectedAttemptIds}
        onToggleSelect={handleToggleSelect}
        onSelectMultiple={handleSelectMultiple}
        onDeselectMultiple={handleDeselectMultiple}
        onBulkRecover={handleBulkRecover}
        onBulkExtendTime={handleBulkExtendTime}
      />

      {/* Centralized Alert Center */}
      <AlertCenter
        alerts={alerts}
        onAlertResolved={() => refetch()}
        onAllAlertsResolved={() => refetch()}
      />

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
        selectedAttemptIds={selectedAttemptIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAllVisible}
        onClearSelection={handleClearSelection}
      />

      {/* 9-Tab Candidate Detail Drawer */}
      <CandidateDetailDrawer
        candidate={liveSelectedCandidate}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onOpenRecovery={handleOpenRecovery}
        onActionComplete={() => refetch()}
      />

      {/* Safe Recovery Center Modal */}
      <RecoveryCenterModal
        candidate={recoveryCandidate}
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        onRecoveryComplete={() => refetch()}
      />

      {/* Floating Bulk Actions Bar */}
      <BulkActionBar
        selectedCount={selectedAttemptIds.size}
        onExtendTime={(minutes) => handleBulkExtendTime(minutes)}
        onRecover={(graceMinutes) => handleBulkRecover(undefined, graceMinutes)}
        onForceSubmit={() => handleBulkForceSubmit()}
        onDelete={() => handleBulkDelete()}
        onClearSelection={handleClearSelection}
        isActing={isBulkActing}
      />
    </div>
  );
}
