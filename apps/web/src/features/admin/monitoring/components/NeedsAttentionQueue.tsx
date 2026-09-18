'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  RotateCcw,
  WifiOff,
  ShieldAlert,
  ArrowRight,
  Clock,
  User,
} from 'lucide-react';
import { CandidateItem } from '../hooks/useLiveMonitoring';

interface NeedsAttentionQueueProps {
  candidates: CandidateItem[];
  onSelectCandidate: (candidate: CandidateItem) => void;
  onOpenRecovery: (candidate: CandidateItem) => void;
}

export function NeedsAttentionQueue({
  candidates = [],
  onSelectCandidate,
  onOpenRecovery,
}: NeedsAttentionQueueProps) {
  const attentionCandidates = (candidates || []).filter((c) => c && c.isNeedsAttention);

  if (attentionCandidates.length === 0) {
    return null;
  }

  return (
    <Card className='border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm animate-fade-in-up'>
      <CardHeader className='pb-3 pt-3 px-4 border-b border-amber-200/60 dark:border-amber-900/40 flex flex-row items-center justify-between'>
        <div className='flex items-center gap-2'>
          <AlertTriangle className='size-4 text-amber-600 dark:text-amber-400 animate-pulse' />
          <CardTitle className='text-sm font-semibold text-amber-900 dark:text-amber-200'>
            Needs Attention Queue ({attentionCandidates.length})
          </CardTitle>
        </div>
        <span className='text-xs text-amber-700 dark:text-amber-300'>
          Candidates requiring administrative review or intervention
        </span>
      </CardHeader>
      <CardContent className='p-3'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5'>
          {attentionCandidates.slice(0, 6).map((c) => {
            const isAutoSubmitted =
              c.status === 'AUTO_SUBMITTED' || c.status === 'ADMIN_REVIEW';
            const isDisconnected = c.status === 'DISCONNECTED';
            const isAutosaveFail = c.autosaveHealth === 'FAILED';

            return (
              <div
                key={c.attemptId}
                className='p-3 rounded-md bg-card border border-amber-200/80 dark:border-amber-800/60 shadow-2xs flex flex-col justify-between space-y-2 hover:border-amber-400 transition-all'
              >
                <div className='flex items-start justify-between gap-2'>
                  <div className='space-y-0.5 overflow-hidden'>
                    <div className='flex items-center gap-1.5'>
                      <User className='size-3.5 text-muted-foreground shrink-0' />
                      <span className='font-medium text-xs text-foreground truncate'>
                        {c.candidateName || 'Candidate'}
                      </span>
                    </div>
                    <p className='text-[11px] text-muted-foreground truncate'>
                      {c.candidateEmail}
                    </p>
                  </div>

                  <Badge
                    variant={isAutoSubmitted ? 'destructive' : 'secondary'}
                    className='text-[10px] shrink-0'
                  >
                    {c.status}
                  </Badge>
                </div>

                <div className='flex items-center gap-1.5 flex-wrap text-[11px]'>
                  {(c.incidentReasons || []).map((reason, idx) => (
                    <span
                      key={idx}
                      className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-medium'
                    >
                      {reason}
                    </span>
                  ))}
                  {(c.proctoringStrikes || 0) > 0 && (
                    <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-medium'>
                      <ShieldAlert className='size-3' />
                      {c.proctoringStrikes} Strikes
                    </span>
                  )}
                </div>

                <div className='flex items-center justify-between pt-1 border-t border-border/50 text-xs'>
                  <span className='text-muted-foreground text-[11px] flex items-center gap-1'>
                    <Clock className='size-3' />
                    {Math.floor(c.remainingTimeSeconds / 60)}m left
                  </span>

                  <div className='flex items-center gap-1'>
                    {isAutoSubmitted && (
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => onOpenRecovery(c)}
                        className='h-6 text-[11px] gap-1 px-2'
                      >
                        <RotateCcw className='size-3' />
                        Recover
                      </Button>
                    )}
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => onSelectCandidate(c)}
                      className='h-6 text-[11px] gap-1 px-2'
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
      </CardContent>
    </Card>
  );
}
