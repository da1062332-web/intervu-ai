'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Clock,
  WifiOff,
  ClipboardX,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CandidateItem } from '../hooks/useLiveMonitoring';

function formatReasonLabel(reason: string): string {
  return reason
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function reasonIcon(reason: string) {
  const key = reason.toUpperCase();
  if (key.includes('DISCONNECT')) return <WifiOff className='size-3' />;
  if (key.includes('TIME')) return <Clock className='size-3' />;
  return <ClipboardX className='size-3' />;
}

const STATUS_STYLES: Record<string, string> = {
  AUTO_SUBMITTED:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900',
  ADMIN_REVIEW:
    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900',
  DISCONNECTED:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800',
};

const STATUS_DOT: Record<string, string> = {
  AUTO_SUBMITTED: 'bg-rose-500',
  ADMIN_REVIEW: 'bg-purple-500',
  DISCONNECTED: 'bg-slate-400',
};

interface NeedsAttentionQueueProps {
  candidates: CandidateItem[];
  onSelectCandidate: (candidate: CandidateItem) => void;
  onOpenRecovery: (candidate: CandidateItem) => void;
  selectedAttemptIds?: Set<string>;
  onToggleSelect?: (attemptId: string) => void;
  onSelectMultiple?: (attemptIds: string[]) => void;
  onDeselectMultiple?: (attemptIds: string[]) => void;
  onBulkRecover?: (attemptIds: string[]) => void;
  onBulkExtendTime?: (attemptIds: string[], minutes: number) => void;
}

export function NeedsAttentionQueue({
  candidates = [],
  onSelectCandidate,
  onOpenRecovery,
  selectedAttemptIds = new Set(),
  onToggleSelect,
  onSelectMultiple,
  onDeselectMultiple,
  onBulkRecover,
  onBulkExtendTime,
}: NeedsAttentionQueueProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const attentionCandidates = (candidates || []).filter((c) => c && c.isNeedsAttention);

  if (attentionCandidates.length === 0) {
    return null;
  }

  const allAttentionIds = attentionCandidates.map((c) => c.attemptId);
  const autoSubmittedIds = attentionCandidates
    .filter((c) => c.status === 'AUTO_SUBMITTED' || c.status === 'ADMIN_REVIEW')
    .map((c) => c.attemptId);

  const allSelected =
    attentionCandidates.length > 0 &&
    attentionCandidates.every((c) => selectedAttemptIds.has(c.attemptId));

  const someSelected =
    !allSelected && attentionCandidates.some((c) => selectedAttemptIds.has(c.attemptId));

  const handleToggleSelectAll = () => {
    if (allSelected) {
      onDeselectMultiple?.(allAttentionIds);
    } else {
      onSelectMultiple?.(allAttentionIds);
    }
  };

  const visibleCandidates = isExpanded ? attentionCandidates : attentionCandidates.slice(0, 6);

  return (
    <Card className='overflow-hidden border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm animate-fade-in-up'>
      <CardHeader className='pb-3.5 pt-3.5 px-4 sm:px-5 border-b border-amber-200/60 dark:border-amber-900/40 flex flex-col lg:flex-row lg:items-center justify-between gap-3'>
        <div className='flex items-start gap-2.5 min-w-0'>
          <span className='mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/60'>
            <AlertTriangle className='size-3.5 text-amber-600 dark:text-amber-400' />
          </span>
          <div className='min-w-0'>
            <CardTitle className='text-sm font-semibold text-amber-900 dark:text-amber-200 leading-tight'>
              Needs Attention Queue
              <span className='ml-1.5 font-mono text-amber-700/80 dark:text-amber-400/80'>
                ({attentionCandidates.length})
              </span>
            </CardTitle>
            <p className='text-xs text-amber-700/90 dark:text-amber-300/80 mt-0.5'>
              Candidates requiring administrative review or intervention
            </p>
          </div>
        </div>

        {/* Quick Bulk Action Buttons */}
        <div className='flex items-center gap-2 flex-wrap shrink-0'>
          <Button
            size='sm'
            variant='outline'
            onClick={handleToggleSelectAll}
            className='h-8 text-xs gap-1.5 px-3 font-medium border-amber-300 dark:border-amber-800 bg-background/80 hover:bg-amber-100 dark:hover:bg-amber-900/40'
          >
            {allSelected ? (
              <CheckSquare className='size-3.5 text-primary' />
            ) : (
              <Square className='size-3.5 text-muted-foreground' />
            )}
            {allSelected ? 'Deselect All' : `Select All (${attentionCandidates.length})`}
          </Button>

          {autoSubmittedIds.length > 0 && onBulkRecover && (
            <Button
              size='sm'
              variant='destructive'
              onClick={() => onBulkRecover(autoSubmittedIds)}
              className='h-8 text-xs gap-1.5 px-3 font-medium shadow-sm'
            >
              <RotateCcw className='size-3.5' />
              Recover All Auto-Submitted ({autoSubmittedIds.length})
            </Button>
          )}

          {onBulkExtendTime && (
            <Button
              size='sm'
              variant='outline'
              onClick={() => onBulkExtendTime(allAttentionIds, 10)}
              className='h-8 text-xs gap-1.5 px-3 font-medium border-amber-300 dark:border-amber-800 bg-background/80 hover:bg-amber-100 dark:hover:bg-amber-900/40'
            >
              <Clock className='size-3.5 text-amber-600' />
              +10m to All Attention
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className='p-3.5 sm:p-4 space-y-3.5'>
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'>
          {visibleCandidates.map((c) => {
            const isAutoSubmitted =
              c.status === 'AUTO_SUBMITTED' || c.status === 'ADMIN_REVIEW';
            const isSelected = selectedAttemptIds.has(c.attemptId);
            const displayName = c.candidateName || 'Candidate';
            const reasons =
              c.incidentReasons && c.incidentReasons.length > 0
                ? c.incidentReasons
                : c.submissionReason
                  ? [c.submissionReason]
                  : [];
            const statusStyle =
              STATUS_STYLES[c.status] ||
              'bg-muted text-muted-foreground border-border';
            const statusDot = STATUS_DOT[c.status] || 'bg-muted-foreground';

            return (
              <div
                key={c.attemptId}
                className={`group flex flex-col rounded-lg border bg-card p-3.5 shadow-sm transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-primary ring-1 ring-primary/30 bg-primary/[0.03]'
                    : 'border-amber-200/80 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-700'
                }`}
              >
                {/* Identity row */}
                <div className='flex items-start gap-2.5'>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect?.(c.attemptId)}
                    aria-label={`Select ${displayName}`}
                    className='mt-2.5 shrink-0'
                  />

                  <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/10'>
                    {displayName.charAt(0).toUpperCase()}
                  </div>

                  <div className='min-w-0 flex-1 pt-0.5'>
                    <p className='truncate text-sm font-semibold text-foreground' title={displayName}>
                      {displayName}
                    </p>
                    <p className='truncate text-[11px] text-muted-foreground' title={c.candidateEmail}>
                      {c.candidateEmail}
                    </p>
                  </div>
                </div>

                {/* Status + reasons */}
                <div className='mt-3 flex flex-wrap items-center gap-1.5'>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${statusStyle}`}
                  >
                    <span className={`size-1.5 rounded-full ${statusDot}`} />
                    {formatReasonLabel(c.status)}
                  </span>

                  {reasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className='inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                    >
                      {reasonIcon(reason)}
                      {formatReasonLabel(reason)}
                    </span>
                  ))}

                  {(c.proctoringStrikes || 0) > 0 && (
                    <span className='inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'>
                      <ShieldAlert className='size-3' />
                      {c.proctoringStrikes} Strike{c.proctoringStrikes === 1 ? '' : 's'}
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className='mt-3.5 flex items-center justify-between border-t border-border/60 pt-2.5'>
                  <span className='flex items-center gap-1 text-[11px] font-medium text-muted-foreground'>
                    <Clock className='size-3' />
                    {Math.floor(c.remainingTimeSeconds / 60)}m left
                  </span>

                  <div className='flex items-center gap-1.5'>
                    {isAutoSubmitted && (
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => onOpenRecovery(c)}
                        className='h-7 gap-1 px-2.5 text-[11px] font-medium'
                      >
                        <RotateCcw className='size-3' />
                        Recover
                      </Button>
                    )}
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => onSelectCandidate(c)}
                      className='h-7 gap-1 px-2.5 text-[11px] font-medium'
                    >
                      Inspect
                      <ArrowRight className='size-3' />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expand / Collapse Button if > 6 candidates */}
        {attentionCandidates.length > 6 && (
          <div className='flex justify-center pt-1'>
            <Button
              size='sm'
              variant='ghost'
              onClick={() => setIsExpanded(!isExpanded)}
              className='h-8 text-xs gap-1.5 font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
            >
              {isExpanded ? (
                <>
                  <ChevronUp className='size-3.5' />
                  Show Less (6 of {attentionCandidates.length})
                </>
              ) : (
                <>
                  <ChevronDown className='size-3.5' />
                  Show All {attentionCandidates.length} Candidates in Queue
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
