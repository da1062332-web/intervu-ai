'use client';

import { useExecutionStore } from '../stores/execution.store';
import { useSubmission } from '../hooks/useSubmission';
import { SubmissionSummary } from './SubmissionSummary';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  testId: string;
}

export function SubmissionModal({ isOpen, onClose, testId }: SubmissionModalProps) {
  const { submissionStatus, questions, answers } = useExecutionStore();
  const { submitAssessment } = useSubmission(testId);
  const [localError, setLocalError] = useState<string | null>(null);

  const total = questions.length;
  let answered = 0;
  let markedForReview = 0;

  Object.values(answers).forEach((ans) => {
    if (ans.status === 'MARKED_FOR_REVIEW') {
      markedForReview++;
    } else if (
      ans.selectedOptionId ||
      (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
      ans.textResponse
    ) {
      answered++;
    }
  });

  const unanswered = total - answered - markedForReview;

  const handleSubmit = async () => {
    setLocalError(null);
    try {
      await submitAssessment();
    } catch {
      setLocalError('Failed to submit assessment. Please try again.');
    }
  };

  const isSubmitting = submissionStatus === 'SUBMITTING';
  const hasFailed = submissionStatus === 'FAILED' || localError;

  return (
    <Modal isOpen={isOpen} onClose={isSubmitting ? () => {} : onClose}>
      <div className='space-y-2 mb-4'>
        <h2 className='text-xl font-bold tracking-tight'>Submit Assessment</h2>
        <p className='text-sm text-muted-foreground'>
          Please review your progress before final submission. Once submitted, you cannot edit your
          answers.
        </p>
      </div>
      <div className='mt-4'>
        <SubmissionSummary />

        {hasFailed && (
          <div className='mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-start gap-2'>
            <AlertCircle className='w-5 h-5 shrink-0' />
            <p>
              Submission failed due to a network error. Please check your connection and try again.
            </p>
          </div>
        )}

        {unanswered > 0 && !hasFailed && (
          <div className='mt-4 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 text-sm rounded-md flex items-start gap-2'>
            <AlertTriangle className='w-5 h-5 shrink-0' />
            <p>
              You still have <strong>{unanswered} unanswered</strong>{' '}
              {unanswered === 1 ? 'question' : 'questions'}. Are you sure you want to submit?
            </p>
          </div>
        )}

        <div className='flex justify-end gap-3 mt-6 pt-6 border-t'>
          <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className='min-w-[140px]'>
            {isSubmitting ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Submitting...
              </>
            ) : (
              'Confirm Submission'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
