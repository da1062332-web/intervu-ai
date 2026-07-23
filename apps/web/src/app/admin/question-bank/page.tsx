'use client';

import React, { useState } from 'react';
import { useGeneratedQuestions, usePublishQuestion } from '@/services/question-pool/hooks';
import { QuestionFilters as FilterType } from '@/services/question-pool/types';
import { PoolFilters } from './components/PoolFilters';
import { PublishToolbar } from './components/PublishToolbar';
import { QuestionPoolTable } from './components/QuestionPoolTable';

import { SectionHeader } from '@/components/ui/section-header';

export default function QuestionBankPage() {
  const [filters, setFilters] = useState<FilterType>({});
  const { data: questions = [], isLoading } = useGeneratedQuestions(filters);
  const { mutateAsync: publish } = usePublishQuestion();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const poolQuestions = questions.filter(
    (q) =>
      q.status === 'APPROVED' ||
      q.status === 'Approved' ||
      q.status === 'PUBLISHED' ||
      q.status === 'Published',
  );
  const selectableQuestions = poolQuestions.filter(
    (q) => q.status === 'APPROVED' || q.status === 'Approved',
  );

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
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8 animate-fade-in-up pb-8'>
      <SectionHeader
        title="Question Bank"
        description="Browse, filter, and publish approved questions for use in assessments."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Question Bank' }]}
      />

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
