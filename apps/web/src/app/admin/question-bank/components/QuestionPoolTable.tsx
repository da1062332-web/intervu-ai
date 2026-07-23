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
      cell: (row) => (
        row.status === 'APPROVED' ? (
          <Checkbox 
            checked={selectedIds.includes(row.id)}
            onCheckedChange={() => onToggleSelect(row.id)}
            aria-label={`Select ${row.id}`}
          />
        ) : null
      ),
      
      
    },
    {
      id: 'id',
      header: 'ID',
      cell: (row) => <span className="font-mono text-xs">{row.id}</span>,
    },
    {
      id: 'questionText',
      header: 'Question Statement',
      cell: (row) => (
        <span className="max-w-[300px] truncate block" title={row.questionText}>
          {row.questionText}
        </span>
      ),
    },
    {
      id: 'difficulty',
      header: 'Difficulty',
      cell: (row) => (
        <Badge 
          variant={
            (row.difficulty?.toUpperCase() || 'MEDIUM') === 'HARD' 
              ? 'destructive' 
              : (row.difficulty?.toUpperCase() || 'MEDIUM') === 'MEDIUM' 
                ? 'default' 
                : 'secondary'
          }
        >
          {row.difficulty || 'Medium'}
        </Badge>
      ),
    },
    {
      id: 'templateId',
      header: 'Template',
      cell: (row) => <span className="font-mono text-xs text-muted-foreground">{row.templateId}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status === 'PUBLISHED' ? 'default' : 'secondary'}>
          {row.status}
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
