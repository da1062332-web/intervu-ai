'use client';

import React, { useState } from 'react';
import { useGeneratedQuestions, useApproveQuestion, useRejectQuestion, useRegenerateQuestion } from '@/services/question-pool/hooks';
import { ReviewTable } from './components/ReviewTable';
import { QuestionPreviewDrawer } from './components/QuestionPreviewDrawer';
import { BulkActionToolbar } from './components/BulkActionToolbar';
import { GeneratedQuestion } from '@/services/question-generation/types';

export default function QuestionReviewPage() {
  const { data: questions = [], isLoading } = useGeneratedQuestions();
  const { mutateAsync: approve } = useApproveQuestion();
  const { mutateAsync: reject } = useRejectQuestion();
  const { mutateAsync: regenerate } = useRegenerateQuestion();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewQuestion, setPreviewQuestion] = useState<GeneratedQuestion | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Filter only Drafts for this view
  const draftQuestions = questions.filter(q => q.status === 'Draft');

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === draftQuestions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(draftQuestions.map(q => q.id));
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
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Question Review</h2>
          <p className="text-muted-foreground mt-1">Review, approve, or reject generated questions before they enter the Question Bank.</p>
        </div>
      </div>

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
