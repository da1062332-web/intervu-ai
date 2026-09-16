'use client';

import React, { useState } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, RefreshCw, ArrowLeft } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [attentionOnly, setAttentionOnly] = useState(false);
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
        title='Live Assessment Operations Center'
        description='Real-time concurrent candidate monitoring, automated anomaly detection, and safe state recovery.'
        icon={Activity}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Live Monitoring', href: '/admin/monitoring' },
          { label: `Assessment (${assessmentId})` },
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
                All Assessments
              </Button>
            </Link>
          </div>
        }
      />

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
