'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  RotateCcw,
  Clock,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  CheckCircle,
  Eye,
  Plus,
  X,
} from 'lucide-react';
import { CandidateItem } from '../hooks/useLiveMonitoring';
import { apiClient } from '@/services/api/client';
import { toast } from 'sonner';

const STATUS_FILTER_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  DISCONNECTED: 'Disconnected',
  ATTENTION: 'Needs Attention',
  AUTO_SUBMITTED: 'Auto-Submitted',
  SUBMITTED: 'Submitted / Done',
};

interface CandidateLiveTableProps {
  candidates: CandidateItem[];
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  onStatusFilterChange: (status: string) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onSelectCandidate: (candidate: CandidateItem) => void;
  onOpenRecovery: (candidate: CandidateItem) => void;
  activeStatusFilter: string;
  searchQuery: string;
  isLoading?: boolean;
}

export function CandidateLiveTable({
  candidates = [],
  pagination,
  onPageChange,
  onSearchChange,
  onStatusFilterChange,
  onSelectCandidate,
  onOpenRecovery,
  activeStatusFilter,
  searchQuery,
  isLoading = false,
}: CandidateLiveTableProps) {
  const [extendingId, setExtendingId] = useState<string | null>(null);

  const handleQuickExtendTime = async (candidate: CandidateItem, minutes = 5) => {
    setExtendingId(candidate.attemptId);
    try {
      await apiClient.request(`/admin/monitoring/attempts/${candidate.attemptId}/extend-time`, {
        method: 'POST',
        body: { extraMinutes: minutes, reason: `Quick +${minutes}m proctor extension` },
      });
      toast.success(`Granted +${minutes}m to ${candidate.candidateName || 'Candidate'}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to extend time');
    } finally {
      setExtendingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'>
            <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
            ACTIVE
          </span>
        );
      case 'DISCONNECTED':
        return (
          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'>
            <span className='size-1.5 rounded-full bg-rose-500' />
            OFFLINE
          </span>
        );
      case 'RECONNECTING':
        return (
          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'>
            <span className='size-1.5 rounded-full bg-amber-500 animate-ping' />
            RECONNECTING
          </span>
        );
      case 'AUTO_SUBMITTED':
      case 'ADMIN_REVIEW':
        return (
          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800'>
            <span className='size-1.5 rounded-full bg-purple-500' />
            {status}
          </span>
        );
      case 'RESUME_AUTHORIZED':
        return (
          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800'>
            <span className='size-1.5 rounded-full bg-blue-500 animate-pulse' />
            RESUME APPROVED
          </span>
        );
      case 'SUBMITTED':
      case 'COMPLETED':
        return (
          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
            <CheckCircle className='size-3 text-slate-500' />
            {status}
          </span>
        );
      default:
        return (
          <Badge variant='outline' className='text-xs'>
            {status}
          </Badge>
        );
    }
  };

  const formatRemainingTime = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Once an attempt has ended, its remaining-time/latency fields are stale
  // snapshots, not live values — showing them as "00:00" / "0ms" next to a
  // wifi icon reads as if the candidate is still connected. Render those
  // columns as a plain dash for finished attempts instead.
  const TERMINAL_STATUSES = new Set([
    'SUBMITTED',
    'COMPLETED',
    'AUTO_SUBMITTED',
    'ADMIN_REVIEW',
    'TERMINATED',
  ]);

  const formatSectionLabel = (key: string) => {
    if (!key || key === 'default') return 'General Section';
    return key
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  };

  return (
    <Card className='border shadow-sm bg-card'>
      {/* Table Filters Header
          Status filtering itself lives one place only — the clickable stat
          cards in SystemHealthRibbon above — so this header just shows
          search plus a clear indicator of whatever filter is active,
          instead of a second, out-of-sync set of filter buttons. */}
      <CardHeader className='p-4 border-b space-y-3'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
          <div className='relative flex-1 max-w-md'>
            <Search className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
            <Input
              placeholder='Search candidate name, email, or attempt ID...'
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className='pl-8 h-9 text-xs'
            />
          </div>

          {activeStatusFilter && activeStatusFilter !== 'ALL' && (
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground shrink-0'>
              <span>Filtered by:</span>
              <button
                onClick={() => onStatusFilterChange('ALL')}
                className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors'
              >
                {STATUS_FILTER_LABELS[activeStatusFilter] || activeStatusFilter}
                <X className='size-3' />
              </button>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Table Body — a fixed viewport height with its own scrollbar keeps
          the surrounding dashboard (health ribbon, alerts, filters) on
          screen no matter how many candidates are enrolled, instead of the
          whole page growing to thousands of pixels tall. */}
      <CardContent className='p-0 overflow-x-auto'>
        <div className='max-h-[560px] overflow-y-auto'>
        <table className='w-full text-left text-xs border-collapse'>
          <thead className='sticky top-0 z-10'>
            <tr className='border-b bg-muted/95 backdrop-blur-sm text-muted-foreground font-semibold'>
              <th className='p-3 pl-4'>Candidate</th>
              <th className='p-3'>Live State</th>
              <th className='p-3'>Section & Question</th>
              <th className='p-3'>Progress</th>
              <th className='p-3'>Time Remaining</th>
              <th className='p-3'>Network & Latency</th>
              <th className='p-3'>Violations</th>
              <th className='p-3 pr-4 text-right'>Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            {isLoading && candidates.length === 0 ? (
              [...Array(5)].map((_, i) => (
                <tr key={`skeleton-${i}`} className='animate-pulse'>
                  <td className='p-3 pl-4'>
                    <div className='flex items-center gap-2.5'>
                      <div className='size-8 rounded-full bg-muted shrink-0' />
                      <div className='space-y-1'>
                        <div className='h-3.5 w-28 bg-muted rounded' />
                        <div className='h-2.5 w-36 bg-muted/60 rounded' />
                      </div>
                    </div>
                  </td>
                  <td className='p-3'><div className='h-5 w-16 bg-muted rounded-full' /></td>
                  <td className='p-3'><div className='h-3.5 w-24 bg-muted rounded' /></td>
                  <td className='p-3'><div className='h-2 w-20 bg-muted rounded' /></td>
                  <td className='p-3'><div className='h-3.5 w-14 bg-muted rounded' /></td>
                  <td className='p-3'><div className='h-3.5 w-16 bg-muted rounded' /></td>
                  <td className='p-3'><div className='h-3.5 w-12 bg-muted rounded' /></td>
                  <td className='p-3 pr-4 text-right'><div className='h-7 w-20 bg-muted rounded ml-auto' /></td>
                </tr>
              ))
            ) : candidates.length === 0 ? (
              <tr>
                <td colSpan={8} className='p-8 text-center text-muted-foreground text-xs'>
                  No candidate attempts found matching criteria.
                </td>
              </tr>
            ) : (
              candidates.map((c) => {
                const percent =
                  c.totalQuestions > 0
                    ? Math.round((c.answeredCount / c.totalQuestions) * 100)
                    : 0;

                const isAutoSubmitted =
                  c.status === 'AUTO_SUBMITTED' || c.status === 'ADMIN_REVIEW';
                const isTerminal = TERMINAL_STATUSES.has(c.status);

                return (
                  <tr
                    key={c.attemptId}
                    className={`hover:bg-muted/40 transition-colors ${
                      c.isNeedsAttention ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    {/* Candidate */}
                    <td className='p-3 pl-4'>
                      <div className='flex items-center gap-2.5'>
                        <div className='size-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs'>
                          {(c.candidateName || 'Candidate').charAt(0).toUpperCase()}
                        </div>
                        <div className='overflow-hidden max-w-[180px] sm:max-w-[220px]'>
                          <div className='font-semibold text-foreground truncate'>
                            {c.candidateName || 'Candidate'}
                          </div>
                          <div className='text-[11px] text-muted-foreground truncate'>
                            {c.candidateEmail || '—'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className='p-3 whitespace-nowrap'>{getStatusBadge(c.status)}</td>

                    {/* Section & Question */}
                    <td className='p-3 whitespace-nowrap'>
                      <div className='text-xs font-semibold text-foreground truncate max-w-[140px]'>
                        {formatSectionLabel(c.currentSectionKey)}
                      </div>
                      <div className='text-[11px] text-muted-foreground'>
                        Q{c.currentQuestionIndex + 1} of {c.totalQuestions}
                      </div>
                    </td>

                    {/* Progress */}
                    <td className='p-3'>
                      <div className='w-28 space-y-1'>
                        <div className='flex justify-between text-[11px] text-muted-foreground'>
                          <span>
                            {c.answeredCount}/{c.totalQuestions}
                          </span>
                          <span className='font-semibold'>{percent}%</span>
                        </div>
                        <div className='h-1.5 w-full bg-muted rounded-full overflow-hidden'>
                          <div
                            className='h-full bg-primary transition-all duration-300'
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Remaining Time */}
                    <td className='p-3 whitespace-nowrap'>
                      {isTerminal ? (
                        <span className='text-muted-foreground text-xs'>Ended</span>
                      ) : (
                        <div
                          className={`font-mono font-bold text-xs flex items-center gap-1 ${
                            c.remainingTimeSeconds < 300 ? 'text-rose-500' : 'text-foreground'
                          }`}
                        >
                          <Clock className='size-3 text-muted-foreground' />
                          {formatRemainingTime(c.remainingTimeSeconds)}
                        </div>
                      )}
                    </td>

                    {/* Network & Latency */}
                    <td className='p-3 whitespace-nowrap'>
                      {isTerminal ? (
                        <span className='text-muted-foreground text-xs'>—</span>
                      ) : (
                      <div className='flex items-center gap-1.5'>
                        {c.status === 'DISCONNECTED' ? (
                          <WifiOff className='size-3.5 text-rose-500' />
                        ) : (
                          <Wifi className='size-3.5 text-emerald-500' />
                        )}
                        <span
                          className={`font-mono text-[11px] font-medium ${
                            c.latencyMs > 600 ? 'text-amber-500 font-bold' : 'text-muted-foreground'
                          }`}
                        >
                          {c.latencyMs}ms
                        </span>
                        {c.autosaveHealth === 'FAILED' && (
                          <Badge variant='destructive' className='text-[10px] px-1 py-0 h-4'>
                            Autosave Fail
                          </Badge>
                        )}
                      </div>
                      )}
                    </td>

                    {/* Violations */}
                    <td className='p-3 whitespace-nowrap'>
                      {(c.proctoringStrikes || 0) > 0 ? (
                        <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold'>
                          <ShieldAlert className='size-3' />
                          {c.proctoringStrikes} Strikes
                        </span>
                      ) : (
                        <span className='text-emerald-600 dark:text-emerald-400 font-medium text-[11px]'>Clean</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className='p-3 pr-4 text-right whitespace-nowrap'>
                      <div className='flex items-center justify-end gap-1.5'>
                        {isAutoSubmitted ? (
                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={() => onOpenRecovery(c)}
                            className='h-7 text-xs gap-1 px-2.5 font-bold shadow-2xs'
                          >
                            <RotateCcw className='size-3' />
                            Recover
                          </Button>
                        ) : !isTerminal ? (
                          <Button
                            size='sm'
                            variant='outline'
                            disabled={extendingId === c.attemptId}
                            onClick={() => handleQuickExtendTime(c, 5)}
                            className='h-7 text-xs gap-1 px-2 hover:bg-primary hover:text-primary-foreground font-medium'
                            title='Add 5 minutes to timer'
                          >
                            <Plus className='size-3' />
                            +5m
                          </Button>
                        ) : null}

                        <Button
                          size='sm'
                          variant='secondary'
                          onClick={() => onSelectCandidate(c)}
                          className='h-7 text-xs gap-1 px-2.5 font-medium'
                        >
                          <Eye className='size-3' />
                          Inspect
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </CardContent>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className='p-3 border-t flex items-center justify-between text-xs text-muted-foreground'>
          <div>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalItems)} of{' '}
            {pagination.totalItems} candidates
          </div>

          <div className='flex items-center gap-1'>
            <Button
              size='sm'
              variant='outline'
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className='size-7 p-0'
            >
              <ChevronLeft className='size-4' />
            </Button>
            <span className='px-2 font-semibold text-foreground'>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              size='sm'
              variant='outline'
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className='size-7 p-0'
            >
              <ChevronRight className='size-4' />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
