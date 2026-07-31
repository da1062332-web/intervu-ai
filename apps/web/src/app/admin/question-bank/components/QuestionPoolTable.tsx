import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { GeneratedQuestion } from '@/services/question-generation/types';

export interface QuestionPoolTableProps {
  questions: GeneratedQuestion[];
  isLoading: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}

export function QuestionPoolTable({
  questions,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll
}: QuestionPoolTableProps) {
  // We only show Approved and Published in the Bank
  const poolQuestions = questions.filter(
    (q: any) =>
      q.status === 'APPROVED' ||
      q.status === 'Approved' ||
      q.status === 'PUBLISHED' ||
      q.status === 'Published' ||
      q.rawStatus === 'APPROVED' ||
      q.rawStatus === 'PUBLISHED'
  );
  
  // Exclude Published from selection for Publishing
  const selectableQuestions = poolQuestions.filter(
    (q: any) =>
      q.status === 'APPROVED' ||
      q.status === 'Approved' ||
      q.rawStatus === 'APPROVED'
  );
  
  const allSelected = selectableQuestions.length > 0 && 
                      selectedIds.length === selectableQuestions.length;

  const columns: ColumnDef<any>[] = [
    {
      id: 'select',
      header: (
        <Checkbox 
          checked={allSelected}
          onCheckedChange={onToggleSelectAll}
          aria-label="Select all approved"
        />
      ),
      cell: (item: any) => {
        const isApproved = item.status === 'Approved' || item.status === 'APPROVED' || item.rawStatus === 'APPROVED';
        return isApproved ? (
          <Checkbox 
            checked={selectedIds.includes(item.id)}
            onCheckedChange={() => onToggleSelect(item.id)}
            aria-label={`Select ${item.id}`}
          />
        ) : null;
      },
    },
    {
      id: 'questionText',
      header: 'Question Statement',
      cell: (item: any) => (
        <span className="max-w-[400px] truncate block font-medium text-foreground" title={item.questionText || item.content}>
          {item.questionText || item.content}
        </span>
      ),
    },
    {
      id: 'strategy',
      header: 'Strategy',
      cell: (item: any) => (
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {item.generationStrategy || 'HYBRID'}
        </span>
      ),
    },
    {
      id: 'difficulty',
      header: 'Difficulty',
      cell: (item: any) => {
        const diff = (item.difficulty || item.difficultyLevel || 'MEDIUM').toUpperCase();
        return (
          <Badge 
            variant={
              diff === 'HARD' 
                ? 'destructive' 
                : diff === 'MEDIUM' 
                  ? 'default' 
                  : 'secondary'
            }
          >
            {item.difficulty || item.difficultyLevel || 'Medium'}
          </Badge>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: any) => (
        <Badge variant={item.status === 'Published' || item.status === 'PUBLISHED' || item.rawStatus === 'PUBLISHED' ? 'default' : 'secondary'}>
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="border rounded-xl bg-card shadow-sm mt-4">
      <DataTable
        columns={columns}
        data={poolQuestions || []}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            title="No Questions Found"
            description="No approved or published questions found."
            className="py-12 border-0"
          />
        }
      />
    </div>
  );
}
