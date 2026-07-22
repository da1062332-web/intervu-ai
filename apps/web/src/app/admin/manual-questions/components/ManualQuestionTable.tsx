import React from 'react';
import { ManualQuestion } from '@/services/manual-questions/types';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { AnimatedLoader } from '@/components/ui/animated-loader';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { useDeleteManualQuestion } from '@/services/manual-questions/hooks';
import { useConcepts } from '@/services/concept-mapping/hooks';

function ConceptNameCell({ topicId, conceptId }: { topicId?: string; conceptId?: string }) {
  const { data: concepts, isLoading } = useConcepts(topicId || '', false);
  
  if (!conceptId) return <span className="text-muted-foreground">N/A</span>;
  if (isLoading) return <Skeleton className="h-4 w-20" />;
  
  const conceptsArray = Array.isArray(concepts) 
    ? concepts 
    : (concepts as any)?.data 
      ? (concepts as any).data 
      : (concepts as any)?.items 
        ? (concepts as any).items 
        : [];

  const concept = conceptsArray.find((c: any) => c.id === conceptId);
  return (
    <span title={concept?.name || conceptId}>
      {concept?.name || conceptId}
    </span>
  );
}

interface ManualQuestionTableProps {
  questions: ManualQuestion[];
  isLoading: boolean;
  onEdit?: (question: ManualQuestion) => void;
}

export function ManualQuestionTable({
  questions,
  isLoading,
  onEdit,
}: ManualQuestionTableProps) {
  const { mutate: deleteQuestion } = useDeleteManualQuestion();

  const columns: ColumnDef<ManualQuestion>[] = [
    {
      header: 'Question Text',
      cell: (row) => (
        <p className='truncate font-medium max-w-[400px]' title={row.questionText}>
          {row.questionText}
        </p>
      ),
    },
    {
      header: 'Type',
      cell: (row) => <Badge variant='outline'>{row.questionType}</Badge>,
    },
    {
      header: 'Difficulty',
      cell: (row) => (
        <Badge
          variant={
            row.difficulty === 'HARD'
              ? 'destructive'
              : row.difficulty === 'MEDIUM'
                ? 'default'
                : 'secondary'
          }
        >
          {row.difficulty}
        </Badge>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge
          variant={
            row.status === 'ACTIVE'
              ? 'default'
              : row.status === 'DRAFT'
                ? 'outline'
                : 'secondary'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Concept',
      className: 'text-sm text-muted-foreground',
      cell: (row) => (
        <ConceptNameCell topicId={row.topicId} conceptId={row.conceptId || undefined} />
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className='flex justify-end gap-2'>
          <Button variant='ghost' size='icon' title='Edit Question' onClick={() => onEdit?.(row)}>
            <Edit2 className='h-4 w-4 text-muted-foreground hover:text-foreground' />
          </Button>
          <ConfirmationDialog
            title='Delete Question'
            description='Are you sure you want to delete this question? This action cannot be undone.'
            confirmLabel='Delete'
            destructive
            onConfirm={() => deleteQuestion(row.id)}
            trigger={
              <Button variant='ghost' size='icon' title='Archive Question'>
                <Trash2 className='h-4 w-4 text-muted-foreground hover:text-destructive' />
              </Button>
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className='border rounded-xl bg-card shadow-sm'>
      {isLoading && <AnimatedLoader variant='table' className='my-8' />}

      {!isLoading && (
        <DataTable
          columns={columns}
          data={questions || []}
          rowKey={(row) => row.id}
          emptyState={
            <EmptyState
              title='No Questions Found'
              description='Try adjusting your filters or add a new manual question.'
              className='py-12 border-0'
            />
          }
        />
      )}
    </div>
  );
}
