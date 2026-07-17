import React from 'react';
import { ManualQuestion } from '@/services/manual-questions/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-10 w-full' />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className='h-16 w-full' />
        ))}
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className='text-center py-12 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50'>
        <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
          No Questions Found
        </h3>
        <p className='text-muted-foreground'>Try adjusting your filters or add a new manual question.</p>
      </div>
    );
  }

  return (
    <div className='rounded-md border overflow-hidden'>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question Text</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Concept ID</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question) => (
              <TableRow
                key={question.id}
                className='bg-background hover:bg-muted/50 transition-colors'
              >
                <TableCell className='max-w-[400px]'>
                  <p className='truncate font-medium' title={question.questionText}>
                    {question.questionText}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant='outline'>{question.questionType}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      question.difficulty === 'HARD'
                        ? 'destructive'
                        : question.difficulty === 'MEDIUM'
                          ? 'default'
                          : 'secondary'
                    }
                  >
                    {question.difficulty}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      question.status === 'ACTIVE'
                        ? 'default'
                        : question.status === 'DRAFT'
                          ? 'outline'
                          : 'secondary'
                    }
                  >
                    {question.status}
                  </Badge>
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>
                  <ConceptNameCell topicId={question.topicId} conceptId={question.conceptId || undefined} />
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex justify-end gap-2'>
                    <Button variant='ghost' size='icon' title='Edit Question' onClick={() => onEdit?.(question)}>
                      <Edit2 className='h-4 w-4 text-muted-foreground hover:text-foreground' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      title='Archive Question'
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this question?')) {
                          deleteQuestion(question.id);
                        }
                      }}
                    >
                      <Trash2 className='h-4 w-4 text-muted-foreground hover:text-destructive' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
