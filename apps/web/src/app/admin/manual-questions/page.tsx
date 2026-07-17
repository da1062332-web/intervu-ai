'use client';

import React, { useState } from 'react';
import { useManualQuestions } from '@/services/manual-questions/hooks';
import { ManualQuestionFilters as FilterType, ManualQuestion } from '@/services/manual-questions/types';
import { ManualPoolFilters } from './components/ManualPoolFilters';
import { ManualQuestionTable } from './components/ManualQuestionTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ManualQuestionModal } from './components/ManualQuestionModal';
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
    <div className='flex-1 space-y-4 p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2 mb-6'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Manual Questions</h2>
          <p className='text-muted-foreground mt-1'>
            Manage manual questions that can be mapped directly to concepts.
          </p>
        </div>
        <div>
          <Button onClick={() => router.push('/admin/manual-questions/create')}>
            <Plus className="mr-2 h-4 w-4" /> Add Questions (Batch)
          </Button>
        </div>
      </div>

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
