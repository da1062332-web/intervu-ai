'use client';

import React, { useState } from 'react';
import { useManualQuestions } from '@/services/manual-questions/hooks';
import { ManualQuestionFilters as FilterType, ManualQuestion } from '@/services/manual-questions/types';
import { ManualPoolFilters } from './components/ManualPoolFilters';
import { ManualQuestionTable } from './components/ManualQuestionTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ManualQuestionModal } from './components/ManualQuestionModal';
import { PageHeader } from '@/components/admin/dashboard/page-header';
import { useRouter } from 'next/navigation';

export default function ManualQuestionsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterType>({});
  const { data, isLoading } = useManualQuestions(filters);
  const questions = Array.isArray(data) ? data : (data as any)?.data || (data as any)?.items || [];

  const [editingQuestion, setEditingQuestion] = useState<ManualQuestion | null>(null);

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleEdit = (question: ManualQuestion) => {
    setEditingQuestion(question);
  };

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-4'>
      <PageHeader
        title='Manual Questions'
        subtitle='Manage manual questions that can be mapped directly to concepts.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Manual Questions' }]}
        action={
          <Button onClick={() => router.push('/admin/manual-questions/create')}>
            <Plus className="mr-2 h-4 w-4" /> Add Questions (Batch)
          </Button>
        }
      />

      <ManualPoolFilters filters={filters} setFilters={setFilters} onClear={handleClearFilters} />

      <div className='mt-6'>
        <ManualQuestionTable
          questions={questions}
          isLoading={isLoading}
          onEdit={handleEdit}
        />
      </div>

      {editingQuestion && (
        <ManualQuestionModal 
          isOpen={true} 
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)} 
        />
      )}
    </div>
  );
}
