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
      const res = await apiClient.request<any>(
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
    <Modal isOpen={isOpen} onClose={onClose} className='max-w-lg p-0 overflow-hidden'>
      <div className='p-4 border-b bg-muted/20'>
        <div className='flex items-center gap-2 text-rose-500'>
          <RotateCcw className='size-5' />
          <h3 className='text-base font-semibold text-foreground'>
            Safe Recovery Center
          </h3>
        </div>
        <p className='text-xs text-muted-foreground mt-1'>
          Recover candidate attempt from auto-submitted or interrupted state without losing state
          or duplicate submissions.
        </p>
      </div>

        <div className='p-5 space-y-4 text-xs'>
          {/* State Machine Stepper */}
          <div className='flex items-center justify-between p-2.5 bg-muted/30 rounded-lg border'>
            <div className='flex items-center gap-1.5'>
              <Badge variant='destructive' className='text-[10px]'>
                1. AUTO_SUBMITTED
              </Badge>
              <span className='text-muted-foreground'>→</span>
              <Badge variant='secondary' className='text-[10px]'>
                2. ADMIN_REVIEW
              </Badge>
              <span className='text-muted-foreground'>→</span>
              <Badge className='bg-primary text-[10px]'>3. RESUME_AUTH</Badge>
              <span className='text-muted-foreground'>→</span>
              <Badge variant='outline' className='text-[10px]'>
                4. RESUMED
              </Badge>
            </div>
          </div>

          {/* Incident Details Card */}
          <div className='border rounded-lg p-3 space-y-2 bg-card'>
            <div className='flex items-center justify-between'>
              <span className='font-semibold'>Candidate:</span>
              <span className='font-medium'>{candidate.candidateName}</span>
            </div>
            <div className='flex justify-between text-muted-foreground'>
              <span>Attempt ID:</span>
              <span className='font-mono'>{candidate.attemptId}</span>
            </div>
            <div className='flex justify-between text-muted-foreground'>
              <span>Auto-Submit Reason:</span>
              <span className='font-medium text-rose-600 dark:text-rose-400'>
                {candidate.submissionReason || 'NETWORK_FAILURE / PROCTORING_LIMIT'}
              </span>
            </div>
            <div className='flex justify-between text-muted-foreground'>
              <span>Authoritative Progress:</span>
              <span>
                Section: {candidate.currentSectionKey} • {candidate.answeredCount}/
                {candidate.totalQuestions} Questions
              </span>
            </div>
            <div className='flex justify-between text-muted-foreground'>
              <span>Remaining Time at Checkpoint:</span>
              <span className='font-mono font-medium text-foreground'>
                {Math.round(candidate.remainingTimeSeconds / 60)} minutes
              </span>
            </div>
          </div>

          {/* Grace Period Selector */}
          <div className='space-y-1.5'>
            <label className='font-medium text-foreground flex items-center justify-between'>
              <span>Grant Additional Grace Time:</span>
              <span className='font-semibold text-primary'>+{extraTimeMinutes} Minutes</span>
            </label>
            <div className='grid grid-cols-4 gap-2'>
              {[0, 5, 10, 15].map((mins) => (
                <Button
                  key={mins}
                  type='button'
                  size='sm'
                  variant={extraTimeMinutes === mins ? 'default' : 'outline'}
                  onClick={() => setExtraTimeMinutes(mins)}
                  className='h-8 text-xs font-medium'
                >
                  +{mins} min
                </Button>
              ))}
            </div>
          </div>

          {/* Administrative Reason */}
          <div className='space-y-1.5'>
            <label className='font-medium text-foreground'>
              Administrative Justification (Required for Audit Trail):
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='e.g., Verified accidental network loss; proctor granted resume'
              className='text-xs h-9'
            />
          </div>
        </div>

        <div className='p-4 border-t bg-muted/20 flex flex-row items-center justify-between gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={isForceSubmitting || isSubmitting}
            onClick={handleConfirmFinalSubmit}
            className='text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700'
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
              className='text-xs'
            >
              Cancel
            </Button>
            <Button
              type='button'
              size='sm'
              disabled={isSubmitting}
              onClick={handleAuthorizeResume}
              className='text-xs gap-1.5 bg-primary'
            >
              <RotateCcw className='size-3.5' />
              {isSubmitting ? 'Authorizing...' : 'Authorize Safe Resume'}
            </Button>
          </div>
        </div>
    </Modal>
  );
}
