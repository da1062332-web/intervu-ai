'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Send,
  Lock,
  User,
  Info,
} from 'lucide-react';
import { CandidateItem } from '../hooks/useLiveMonitoring';
import { apiClient } from '@/services/api/client';
import { toast } from 'sonner';

interface RecoveryCenterModalProps {
  candidate: CandidateItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRecoveryComplete: () => void;
}

export function RecoveryCenterModal({
  candidate,
  isOpen,
  onClose,
  onRecoveryComplete,
}: RecoveryCenterModalProps) {
  const [extraTimeMinutes, setExtraTimeMinutes] = useState(5);
  const [reason, setReason] = useState('Authorized after reviewing network interruption / false strike');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForceSubmitting, setIsForceSubmitting] = useState(false);

  if (!candidate) return null;

  const handleAuthorizeResume = async () => {
    if (!reason.trim()) {
      toast.error('Please provide an administrative reason for resuming this attempt');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.request<any>(
        `/admin/monitoring/attempts/${candidate.attemptId}/recover/authorize`,
        {
          method: 'POST',
          body: {
            extraTimeMinutes,
            reason: reason.trim(),
          },
        },
      );

      toast.success('Resume Authorized Successfully', {
        description: `Candidate can now resume. Granted +${extraTimeMinutes} min grace time.`,
      });
      onRecoveryComplete();
      onClose();
    } catch (err: any) {
      if (err?.status === 409) {
        toast.error('Recovery Conflict', {
          description:
            'Another administrator has already taken action on this attempt. Please refresh.',
        });
      } else {
        toast.error(err?.message || 'Failed to authorize recovery');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmFinalSubmit = async () => {
    setIsForceSubmitting(true);
    try {
      await apiClient.request(
        `/admin/monitoring/attempts/${candidate.attemptId}/force-submit`,
        {
          method: 'POST',
          body: {
            source: 'ADMIN',
            reason: 'ADMIN_ACTION',
            reasonDetails: `Recovery declined by proctor: Final submission accepted.`,
          },
        },
      );

      toast.success('Attempt Confirmed as Final Submission');
      onRecoveryComplete();
      onClose();
    } catch (err) {
      toast.error('Failed to confirm submission');
    } finally {
      setIsForceSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className='max-w-lg w-full p-0 flex flex-col max-h-[90vh] overflow-hidden rounded-xl shadow-2xl border'
    >
      {/* Header - Fixed & Pinned */}
      <div className='shrink-0 px-4 py-3 sm:px-5 border-b bg-muted/20 flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2.5'>
          <div className='size-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0'>
            <RotateCcw className='size-4' />
          </div>
          <div>
            <h3 className='text-sm font-bold text-foreground leading-tight'>
              Safe Recovery Center
            </h3>
            <p className='text-[11px] text-muted-foreground'>
              Authorize resumption without losing progress or duplicating attempts
            </p>
          </div>
        </div>
        <Badge variant='outline' className='text-[10px] shrink-0 border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-mono'>
          STATE_LOCKED
        </Badge>
      </div>

      {/* Body - Scrollable content */}
      <div className='flex-1 min-h-0 overflow-y-auto px-4 py-3.5 sm:px-5 space-y-3 text-xs'>
        {/* State Machine Stepper */}
        <div className='p-2.5 bg-muted/30 rounded-lg border space-y-1.5'>
          <div className='flex items-center justify-between text-[10px] font-semibold text-muted-foreground'>
            <span className='flex items-center gap-1'>
              <ShieldCheck className='size-3 text-primary' />
              Recovery Lifecycle
            </span>
            <span className='text-primary font-mono text-[9px] bg-primary/10 px-1.5 py-0.5 rounded font-bold'>
              Step 3: Resume Authorization
            </span>
          </div>

          <div className='grid grid-cols-4 gap-1.5 text-center'>
            <div className='p-1.5 rounded-md border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20'>
              <div className='text-[9px] font-bold text-rose-600 dark:text-rose-400'>1. Triggered</div>
              <div className='text-[8px] text-muted-foreground truncate'>Auto-submit</div>
            </div>

            <div className='p-1.5 rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20'>
              <div className='text-[9px] font-bold text-amber-600 dark:text-amber-400'>2. Review</div>
              <div className='text-[8px] text-muted-foreground truncate'>Proctor check</div>
            </div>

            <div className='p-1.5 rounded-md border border-primary bg-primary text-white shadow-xs font-semibold'>
              <div className='text-[9px] font-bold text-white'>3. Authorize</div>
              <div className='text-[8px] text-white/90 truncate font-medium'>Current step</div>
            </div>

            <div className='p-1.5 rounded-md border border-border/60 bg-muted/20 opacity-60'>
              <div className='text-[9px] font-bold text-muted-foreground'>4. Resumed</div>
              <div className='text-[8px] text-muted-foreground truncate'>Candidate live</div>
            </div>
          </div>
        </div>

        {/* Incident Details Card */}
        <div className='border rounded-lg p-2.5 bg-card/70 space-y-2'>
          <div className='flex items-center justify-between border-b pb-1.5 text-xs'>
            <div className='flex items-center gap-1.5 font-bold text-foreground'>
              <User className='size-3.5 text-muted-foreground' />
              <span>{candidate.candidateName}</span>
            </div>
            <span className='font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded'>
              {candidate.attemptId}
            </span>
          </div>

          <div className='grid grid-cols-3 gap-2 text-[11px]'>
            <div className='bg-muted/30 p-1.5 rounded border space-y-0.5'>
              <div className='text-[9px] text-muted-foreground'>Auto-Submit Reason</div>
              <div className='font-bold text-rose-600 dark:text-rose-400 truncate text-[10px]' title={candidate.submissionReason || 'TIME_EXPIRED / PROCTOR_HALT'}>
                {candidate.submissionReason || 'TIME_EXPIRED'}
              </div>
            </div>

            <div className='bg-muted/30 p-1.5 rounded border space-y-0.5'>
              <div className='text-[9px] text-muted-foreground'>Authoritative Progress</div>
              <div className='font-semibold text-foreground text-[10px] truncate'>
                {candidate.answeredCount}/{candidate.totalQuestions} Qs ({candidate.currentSectionKey || 'Section'})
              </div>
            </div>

            <div className='bg-muted/30 p-1.5 rounded border space-y-0.5'>
              <div className='text-[9px] text-muted-foreground'>Remaining Time</div>
              <div className='font-mono font-bold text-foreground text-[10px]'>
                {Math.round(candidate.remainingTimeSeconds / 60)} min
              </div>
            </div>
          </div>
        </div>

        {/* Grace Period Selector */}
        <div className='space-y-1.5'>
          <div className='flex items-center justify-between'>
            <label className='font-semibold text-foreground text-xs flex items-center gap-1'>
              <Clock className='size-3 text-primary' />
              Grant Additional Grace Time:
            </label>
            <span className='font-mono font-bold text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-full'>
              +{extraTimeMinutes} min grace
            </span>
          </div>
          <div className='grid grid-cols-4 gap-1.5'>
            {[0, 5, 10, 15].map((mins) => (
              <Button
                key={mins}
                type='button'
                size='sm'
                variant={extraTimeMinutes === mins ? 'default' : 'outline'}
                onClick={() => setExtraTimeMinutes(mins)}
                className={`h-8 text-xs font-semibold transition-all ${
                  extraTimeMinutes === mins
                    ? 'bg-primary text-white shadow-xs'
                    : 'hover:bg-accent'
                }`}
              >
                +{mins} min
              </Button>
            ))}
          </div>
        </div>

        {/* Administrative Reason */}
        <div className='space-y-1.5'>
          <label className='font-semibold text-foreground text-xs'>
            Administrative Justification <span className='text-muted-foreground font-normal text-[10px]'>(Required for Audit Trail)</span>
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='e.g., Authorized after reviewing network interruption / false strike'
            className='text-xs h-8'
          />
          <div className='flex flex-wrap gap-1 pt-0.5'>
            {[
              'Network interruption / reconnect issue',
              'Candidate hardware / browser crash',
              'Proctor approved extra grace period',
            ].map((preset) => (
              <button
                key={preset}
                type='button'
                onClick={() => setReason(preset)}
                className='text-[9px] text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted px-1.5 py-0.5 rounded transition-colors text-left truncate'
              >
                ⚡ {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer - Fixed & Pinned at bottom */}
      <div className='shrink-0 px-4 py-3 sm:px-5 border-t bg-muted/30 flex items-center justify-between gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={isForceSubmitting || isSubmitting}
          onClick={handleConfirmFinalSubmit}
          className='text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-8 px-2.5'
        >
          {isForceSubmitting ? 'Confirming...' : 'Decline & Accept Submit'}
        </Button>

        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={onClose}
            disabled={isSubmitting}
            className='text-xs h-8 px-3'
          >
            Cancel
          </Button>
          <Button
            type='button'
            size='sm'
            disabled={isSubmitting}
            onClick={handleAuthorizeResume}
            className='text-xs gap-1.5 bg-primary text-white hover:bg-primary/90 h-8 px-3 font-semibold'
          >
            <RotateCcw className={`size-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
            {isSubmitting ? 'Authorizing...' : 'Authorize Safe Resume'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
