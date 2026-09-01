'use client';

import React, { useState } from 'react';

import {
  useGeneratedQuestions,
  useApproveQuestion,
  useBulkApproveQuestion,
  useRejectQuestion,
  useBulkRejectQuestion,
  useRegenerateQuestion,
} from '@/services/question-pool/hooks';
import { ReviewTable } from './components/ReviewTable';
import { BulkActionToolbar } from './components/BulkActionToolbar';
import { GeneratedQuestion } from '@/services/question-generation/types';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';

export default function QuestionReviewPage() {
  const { data: questions = [], isLoading } = useGeneratedQuestions({ status: 'GENERATED' });
  const { mutateAsync: approve } = useApproveQuestion();
  const { mutateAsync: bulkApprove } = useBulkApproveQuestion();
  const { mutateAsync: reject } = useRejectQuestion();
  const { mutateAsync: bulkReject } = useBulkRejectQuestion();
  const { mutateAsync: regenerate } = useRegenerateQuestion();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewQuestion, setPreviewQuestion] = useState<GeneratedQuestion | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);



  // Filter only generated (pending review) questions for this view
  const draftQuestions = questions.filter(
    (q: any) =>
      q.status === 'Draft' ||
      q.status === 'GENERATED' ||
      q.status === 'DRAFT' ||
      q.rawStatus === 'GENERATED' ||
      q.rawStatus === 'DRAFT',
  );

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleToggleSelectAll = (visibleIds?: string[]) => {
    const targetIds =
      visibleIds && visibleIds.length > 0 ? visibleIds : draftQuestions.map((q) => q.id);

    const allVisibleSelected =
      targetIds.length > 0 && targetIds.every((id) => selectedIds.includes(id));

    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !targetIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...targetIds])));
    }
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await approve(id);
      if (previewQuestion?.id === id) setPreviewQuestion(null);
      toast.success('Question approved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve question');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await reject(id);
      if (previewQuestion?.id === id) setPreviewQuestion(null);
      toast.success('Question rejected');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject question');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRegenerate = async (id: string) => {
    setProcessingId(id);
    try {
      const updated = await regenerate(id);
      if (previewQuestion?.id === id) setPreviewQuestion(updated as any);
      toast.success('Question regenerated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate question');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const res = await bulkApprove(selectedIds);
      setSelectedIds([]);
      toast.success(`Approved ${res.count} questions`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve questions');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const res = await bulkReject(selectedIds);
      setSelectedIds([]);
      toast.success(`Rejected ${res.count} questions`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject questions');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8 animate-fade-in-up pb-8'>
      <SectionHeader
        title='Question Review'
        description='Review, approve, or reject generated questions before they enter the Question Bank.'
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Question Review' },
        ]}
      />

      <BulkActionToolbar
        selectedCount={selectedIds.length}
        onApprove={handleBulkApprove}
        onReject={handleBulkReject}
        isProcessing={isBulkProcessing}
      />

      <ReviewTable
        questions={questions} // Component filters by Draft
        isLoading={isLoading}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onPreview={setPreviewQuestion}
        onApprove={handleApprove}
        onReject={handleReject}
        onRegenerate={handleRegenerate}
        processingId={processingId}
      />

      <Modal
        isOpen={!!previewQuestion}
        onClose={() => setPreviewQuestion(null)}
        className='max-w-4xl max-h-[90vh]'
      >
        {previewQuestion && (
          <div className='space-y-6'>
            <div className='flex items-center justify-between border-b pb-4'>
              <div className="flex items-center gap-3">
                <h2 className='text-xl font-bold'>Question Preview</h2>
                {previewQuestion.difficulty && (
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                    previewQuestion.difficulty.toUpperCase() === 'HARD' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30' :
                    previewQuestion.difficulty.toUpperCase() === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30' :
                    'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30'
                  }`}>
                    {previewQuestion.difficulty}
                  </span>
                )}
              </div>
            </div>
            
            <div className='space-y-2 flex-grow'>
              <h3 className='font-semibold text-sm text-gray-500 uppercase tracking-wider'>
                Statement
              </h3>
              <div className='p-4 bg-gray-50 dark:bg-gray-950 rounded-md border text-sm whitespace-pre-wrap'>
                {previewQuestion.questionText}
              </div>
            </div>

            {previewQuestion.options && previewQuestion.options.length > 0 && (
              <div className='space-y-2'>
                <h3 className='font-semibold text-sm text-gray-500 uppercase tracking-wider'>
                  Options
                </h3>
                <ul className='list-inside list-decimal space-y-1 bg-gray-50 dark:bg-gray-950 rounded-md border p-4 text-sm whitespace-pre-wrap'>
                  {previewQuestion.options.map((opt: any, idx: number) => {
                    const optText =
                      typeof opt === 'object' && opt !== null
                        ? opt.text ?? opt.optionText ?? opt.value ?? opt.label ?? JSON.stringify(opt)
                        : String(opt);
                    const isCorrect =
                      (typeof opt === 'object' && opt !== null && opt.isCorrect === true) ||
                      opt === previewQuestion.correctAnswer ||
                      optText === previewQuestion.correctAnswer ||
                      (typeof opt === 'object' && opt !== null && opt.id === previewQuestion.correctAnswer);

                    return (
                      <li key={idx} className={isCorrect ? 'font-bold text-green-600 dark:text-green-400' : ''}>
                        {optText}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className='pt-4 border-t'>
              <h3 className='font-semibold text-sm text-gray-500 uppercase tracking-wider mb-4'>
                Solution
              </h3>
              <div className='p-4 bg-gray-50 dark:bg-gray-950 rounded-md border text-sm whitespace-pre-wrap'>
                {typeof previewQuestion.correctAnswer === 'string'
                  ? previewQuestion.correctAnswer.replace(/^"|"$/g, '')
                  : JSON.stringify(previewQuestion.correctAnswer, null, 2)}
              </div>
            </div>

            {previewQuestion.explanation && (
              <div className='pt-4 border-t'>
                <h3 className='font-semibold text-sm text-gray-500 uppercase tracking-wider mb-4'>
                  Explanation
                </h3>
                <div className='p-4 bg-gray-50 dark:bg-gray-950 rounded-md border text-sm whitespace-pre-wrap'>
                  {previewQuestion.explanation}
                </div>
              </div>
            )}

            <div className='pt-6 border-t flex flex-wrap gap-2 justify-end'>
              <Button
                variant='destructive'
                onClick={() => handleReject(previewQuestion.id)}
                disabled={processingId === previewQuestion.id}
              >
                {processingId === previewQuestion.id ? 'Processing...' : 'Reject'}
              </Button>
              <Button
                variant='secondary'
                onClick={() => handleRegenerate(previewQuestion.id)}
                disabled={processingId === previewQuestion.id}
              >
                {processingId === previewQuestion.id ? 'Processing...' : 'Regenerate'}
              </Button>
              <Button
                variant='default'
                onClick={() => handleApprove(previewQuestion.id)}
                disabled={processingId === previewQuestion.id}
              >
                {processingId === previewQuestion.id ? 'Processing...' : 'Approve'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
