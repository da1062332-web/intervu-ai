'use client';

import { useExecutionStore } from '../stores/execution.store';
import { useSubmission } from '../hooks/useSubmission';
import { SubmissionSummary } from './SubmissionSummary';
import { Modal } from '@/components/ui/modal';
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
      await submitAssessment({ allowPartial: unanswered > 0 });
    } catch {
      setLocalError('Failed to submit assessment. Please try again.');
    }
  };

  const isSubmitting = submissionStatus === 'SUBMITTING';
  const hasFailed = submissionStatus === 'FAILED' || localError;

  return (
    <Modal isOpen={isOpen} onClose={isSubmitting ? () => {} : onClose}>
      <div className='space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar text-gray-800 font-sans select-none'>
        <div className='border-b pb-3 border-gray-200'>
          <h2 className='text-xl font-bold text-gray-900 tracking-tight'>
            Submit Assessment
          </h2>
          <p className='text-xs text-gray-600 mt-1'>
            Please review your question status breakdown before final submission. Once submitted, answers cannot be edited.
          </p>
        </div>

        <div className='mt-3'>
          <SubmissionSummary />

          {hasFailed && (
            <div className='mt-4 p-3.5 bg-red-50 border border-red-300 text-red-800 text-xs rounded-sm flex items-start gap-2.5 shadow-2xs'>
              <AlertCircle className='w-4 h-4 shrink-0 text-red-600 mt-0.5' />
              <p>
                Submission failed due to a network error. Please check your connection and try submitting again.
              </p>
            </div>
          )}

          {unanswered > 0 && !hasFailed && (
            <div className='mt-4 p-3.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-sm flex items-start gap-2.5 shadow-2xs'>
              <AlertTriangle className='w-4 h-4 shrink-0 text-amber-600 mt-0.5' />
              <p>
                You have <strong>{unanswered} unanswered</strong>{' '}
                {unanswered === 1 ? 'question' : 'questions'}. Are you sure you want to proceed with final submission?
              </p>
            </div>
          )}

          <div className='flex flex-row items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200'>
            <button
              type='button'
              onClick={onClose}
              disabled={isSubmitting}
              className='bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 font-bold text-xs px-5 py-2.5 h-9 rounded-sm shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed m-0'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleSubmit}
              disabled={isSubmitting}
              className='bg-[#27783f] hover:bg-[#1f6333] text-white border border-[#195028] font-bold text-xs px-6 py-2.5 h-9 rounded-sm shadow-sm transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center m-0 min-w-[140px]'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='w-3.5 h-3.5 mr-2 animate-spin' />
                  Submitting...
                </>
              ) : (
                'Confirm Submission'
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
