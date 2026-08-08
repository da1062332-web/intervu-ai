import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { type ConceptMapping } from '@/services/concept-mapping';
import { useManualQuestions, useUpdateManualQuestion } from '@/services/manual-questions/hooks';

interface ConceptManualQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  concept: ConceptMapping | null;
}

export function ConceptManualQuestionsModal({
  isOpen,
  onClose,
  concept,
}: ConceptManualQuestionsModalProps) {
  const {
    data: response,
    isLoading,
    isError,
  } = useManualQuestions(concept ? { conceptId: concept.id } : undefined);

  const updateQuestion = useUpdateManualQuestion();

  // Filter locally as well to be safe
  const allQuestions = Array.isArray(response)
    ? response
    : (response as any)?.data || (response as any)?.items || [];
  const questions = allQuestions.filter((q: any) => q.conceptId === concept?.id);

  const handleActivate = (q: any) => {
    updateQuestion.mutate({
      id: q.id,
      payload: { status: 'ACTIVE' },
      currentStatus: q.status,
    });
  };

  if (!isOpen || !concept) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className='max-w-3xl max-h-[80vh] flex flex-col'>
      <div className='flex-none pb-4 border-b'>
        <h2 className='text-xl font-semibold'>Manual Questions</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Viewing questions for concept:{' '}
          <span className='font-medium text-foreground'>{concept.name || concept.conceptName}</span>
        </p>
      </div>

      <div className='flex-1 overflow-y-auto py-4'>
        {isLoading ? (
          <div className='space-y-4'>
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-16 w-full' />
          </div>
        ) : isError ? (
          <div className='text-center py-8 text-destructive'>Failed to load manual questions.</div>
        ) : questions.length === 0 ? (
          <div className='text-center py-12 border-2 border-dashed rounded-lg bg-muted/10'>
            <p className='text-muted-foreground mb-4'>
              No manual questions found for this concept.
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {questions.map((q: any) => (
              <div
                key={q.id}
                className='border rounded-lg p-4 bg-card shadow-sm flex items-center justify-between'
              >
                <div>
                  <div className='font-medium text-sm mb-2'>{q.questionText}</div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant='secondary' className='text-[10px] uppercase'>
                      {q.questionType}
                    </Badge>
                    <Badge variant='outline' className='text-[10px] uppercase'>
                      {q.difficulty}
                    </Badge>
                    <span
                      className={`text-[10px] font-medium ${q.status === 'ACTIVE' ? 'text-green-600' : 'text-muted-foreground'}`}
                    >
                      {q.status}
                    </span>
                  </div>
                </div>
                {q.status !== 'ACTIVE' && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleActivate(q)}
                    disabled={updateQuestion.isPending}
                  >
                    Activate
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='flex-none pt-4 border-t flex justify-end'>
        <Button onClick={onClose} variant='outline'>
          Close
        </Button>
      </div>
    </Modal>
  );
}
