'use client';

import React, { useState } from 'react';
import { useGeneratedQuestions, usePublishQuestion } from '@/services/question-pool/hooks';
import { QuestionFilters as FilterType } from '@/services/question-pool/types';
import { PoolFilters } from './components/PoolFilters';
import { PublishToolbar } from './components/PublishToolbar';
import { QuestionPoolTable } from './components/QuestionPoolTable';

export default function QuestionBankPage() {
  const [filters, setFilters] = useState<FilterType>({});
  const { data: questions = [], isLoading } = useGeneratedQuestions(filters);
  const { mutateAsync: publish } = usePublishQuestion();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const poolQuestions = questions.filter(
    (q) => q.status === 'APPROVED' || q.status === 'PUBLISHED',
  );
  const selectableQuestions = poolQuestions.filter((q) => q.status === 'APPROVED');

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === selectableQuestions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableQuestions.map((q) => q.id));
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      for (const id of selectedIds) {
        await publish(id);
      }
      setSelectedIds([]);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <div className='flex-1 space-y-4 p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2 mb-6'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Question Bank</h2>
          <p className='text-muted-foreground mt-1'>
            Browse, filter, and publish approved questions for use in assessments.
          </p>
        </div>
      </div>

      <PoolFilters filters={filters} setFilters={setFilters} onClear={handleClearFilters} />

      <div className='mt-6'>
        <PublishToolbar
          selectedCount={selectedIds.length}
          onPublish={handlePublish}
          isProcessing={isPublishing}
        />

        <QuestionPoolTable
          questions={questions}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
        />
      </div>
    </div>
  );
}
