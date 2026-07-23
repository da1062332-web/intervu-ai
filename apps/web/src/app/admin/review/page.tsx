'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  useGeneratedQuestions,
  useApproveQuestion,
  useRejectQuestion,
  useRegenerateQuestion,
} from '@/services/question-pool/hooks';
import { ReviewTable } from './components/ReviewTable';
import { QuestionPreviewDrawer } from './components/QuestionPreviewDrawer';
import { BulkActionToolbar } from './components/BulkActionToolbar';
import { GeneratedQuestion } from '@/services/question-generation/types';
import { SectionHeader } from '@/components/ui/section-header';

export default function QuestionReviewPage() {
  const { data: questions = [], isLoading } = useGeneratedQuestions({ status: 'GENERATED' });
  const { mutateAsync: approve } = useApproveQuestion();
  const { mutateAsync: reject } = useRejectQuestion();
  const { mutateAsync: regenerate } = useRegenerateQuestion();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewQuestion, setPreviewQuestion] = useState<GeneratedQuestion | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const searchParams = useSearchParams();

  // If navigated with ?focus=<id>, fetch that specific question and open preview
  React.useEffect(() => {
    const focusId = searchParams?.get?.('focus');
    if (!focusId) return;

    let mounted = true;
    (async () => {
      try {
        // lazy import to avoid circular imports
        const { questionPoolApi } = await import('@/services/question-pool/api');
        const q = await questionPoolApi.getQuestion(focusId);
        if (mounted) {
          setPreviewQuestion(q);
        }
      } catch (err) {
        // ignore – if question isn't found, the list will show available items
        console.debug('Focused generated question not found', err);
      }
    })();

    return () => { mounted = false; };
  }, [searchParams]);

  // Filter only generated (pending review) questions for this view
  const draftQuestions = questions.filter(
    (q: any) =>
      q.status === 'Draft' ||
      q.status === 'GENERATED' ||
      q.status === 'DRAFT' ||
      q.rawStatus === 'GENERATED' ||
      q.rawStatus === 'DRAFT'
  );

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleToggleSelectAll = (visibleIds?: string[]) => {
    const targetIds = visibleIds && visibleIds.length > 0 
      ? visibleIds 
      : draftQuestions.map((q) => q.id);

    const allVisibleSelected = targetIds.length > 0 && targetIds.every((id) => selectedIds.includes(id));

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
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await reject(id);
      if (previewQuestion?.id === id) setPreviewQuestion(null);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRegenerate = async (id: string) => {
    setProcessingId(id);
    try {
      const updated = await regenerate(id);
      if (previewQuestion?.id === id) setPreviewQuestion(updated as any);
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkApprove = async () => {
    setIsBulkProcessing(true);
    try {
      for (const id of selectedIds) {
        await approve(id);
      }
      setSelectedIds([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    setIsBulkProcessing(true);
    try {
      for (const id of selectedIds) {
        await reject(id);
      }
      setSelectedIds([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8 animate-fade-in-up pb-8'>
      <SectionHeader
        title="Question Review"
        description="Review, approve, or reject generated questions before they enter the Question Bank."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Question Review' }]}
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

      <QuestionPreviewDrawer
        question={previewQuestion}
        isOpen={!!previewQuestion}
        onClose={() => setPreviewQuestion(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onRegenerate={handleRegenerate}
        isApproving={processingId === previewQuestion?.id}
        isRejecting={processingId === previewQuestion?.id}
        isRegenerating={processingId === previewQuestion?.id}
      />
    </div>
  );
}
