import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { AnimatedLoader } from '@/components/ui/animated-loader';
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
      cell: ({ row }) => (
        row.original.status === 'APPROVED' ? (
          <Checkbox 
            checked={selectedIds.includes(row.original.id)}
            onCheckedChange={() => onToggleSelect(row.original.id)}
            aria-label={`Select ${row.original.id}`}
          />
        ) : null
      ),
      
      
    },
    {
      id: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
    },
    {
      id: 'questionText',
      header: 'Question Statement',
      cell: ({ row }) => (
        <span className="max-w-[300px] truncate block" title={row.original.questionText}>
          {row.original.questionText}
        </span>
      ),
    },
    {
      id: 'difficulty',
      header: 'Difficulty',
      cell: ({ row }) => <Badge variant="outline">{row.original.difficulty}</Badge>,
    },
    {
      id: 'templateId',
      header: 'Template',
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.templateId}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'PUBLISHED' ? 'default' : 'secondary'}>
          {row.original.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="border rounded-xl bg-card shadow-sm mt-4">
      {isLoading && <AnimatedLoader variant="table" className="my-8" />}
      {!isLoading && (
        <DataTable
          columns={columns}
          data={poolQuestions || []}
          emptyState={
            <EmptyState
              title="No Questions Found"
              description="No approved or published questions found."
              className="py-12 border-0"
            />
          }
        />
      )}
    </div>
  );
}
