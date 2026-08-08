import React, { useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useTemplatePreviewStore } from '@/store/template-preview.store';
import { PreviewResultPanel } from '@/app/admin/templates/[id]/components/PreviewResultPanel';
import { ValidationWidget } from '@/app/admin/templates/[id]/components/ValidationWidget';
import { SolutionTemplateEditor } from '@/app/admin/templates/[id]/components/SolutionTemplateEditor';
import { GeneratedQuestion } from '@/services/question-generation/types';

export interface QuestionPreviewDrawerProps {
  question: GeneratedQuestion | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRegenerate: (id: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  isRegenerating?: boolean;
}

export function QuestionPreviewDrawer({
  question,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onRegenerate,
  isApproving,
  isRejecting,
  isRegenerating,
}: QuestionPreviewDrawerProps) {
  const { setPreviewResult, setSolutionTemplate, setExplanationTemplate, reset } =
    useTemplatePreviewStore();

  useEffect(() => {
    if (isOpen && question) {
      const answerValue = question.correctAnswer ?? question.answer;
      // Hydrate the store so existing template components can render it correctly
      setPreviewResult({
        solution: answerValue ? JSON.stringify(answerValue) : 'Solution not provided.',
        explanation: question.explanation || 'No explanation generated.',
        resolvedVariables: question.resolvedVariables || {},
      });
      setSolutionTemplate(answerValue ? JSON.stringify(answerValue, null, 2) : '');
      setExplanationTemplate(question.explanation || '');
    } else {
      reset();
    }
  }, [isOpen, question, setPreviewResult, setSolutionTemplate, setExplanationTemplate, reset]);

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent className='w-[800px] sm:max-w-[900px] overflow-y-auto'>
        <SheetHeader className='mb-6'>
          <SheetTitle>Question Review</SheetTitle>
          <SheetDescription>
            Review the generated question before approving or rejecting it.
          </SheetDescription>
        </SheetHeader>

        {question ? (
          <div className='space-y-6'>
            <div className='space-y-2'>
              <h3 className='font-semibold text-sm text-gray-500 uppercase tracking-wider'>
                Statement
              </h3>
              <div className='p-4 bg-gray-50 dark:bg-gray-900 rounded-md border text-sm whitespace-pre-wrap'>
                {question.questionText}
              </div>
            </div>

            {question.instructions && (
              <div className='space-y-2'>
                <h3 className='font-semibold text-sm text-gray-500 uppercase tracking-wider'>
                  Instructions
                </h3>
                <div className='p-4 bg-gray-50 dark:bg-gray-900 rounded-md border text-sm'>
                  {question.instructions}
                </div>
              </div>
            )}

            {question.options && question.options.length > 0 && (
              <div className='space-y-2'>
                <h3 className='font-semibold text-sm text-gray-500 uppercase tracking-wider'>
                  Options
                </h3>
                <ul className='list-inside list-decimal space-y-1 bg-gray-50 dark:bg-gray-900 rounded-md border p-4 text-sm whitespace-pre-wrap'>
                  {question.options.map((opt, idx) => (
                    <li
                      key={idx}
                      className={
                        opt === question.correctAnswer
                          ? 'font-bold text-green-600 dark:text-green-400'
                          : ''
                      }
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reusing existing components */}
            <div className='pt-4 border-t'>
              <h3 className='font-semibold text-sm text-gray-500 uppercase tracking-wider mb-4'>
                Solution & Validation
              </h3>
              {/* Read-only solution editor */}
              <div className='opacity-80 pointer-events-none'>
                <SolutionTemplateEditor
                  solutionTemplate={
                    typeof question.correctAnswer === 'string'
                      ? question.correctAnswer.replace(/^"|"$/g, '')
                      : question.correctAnswer
                        ? JSON.stringify(question.correctAnswer, null, 2)
                        : ''
                  }
                  explanationTemplate={question.explanation || ''}
                  setSolutionTemplate={() => {}}
                  setExplanationTemplate={() => {}}
                />
              </div>
              <div className='mt-4'>
                <ValidationWidget />
                <PreviewResultPanel />
              </div>
            </div>
          </div>
        ) : (
          <div className='p-4 text-center text-muted-foreground'>No question selected.</div>
        )}

        <SheetFooter className='mt-8 border-t pt-4 flex gap-2 sm:justify-end'>
          <Button variant='outline' onClick={onClose}>
            Close
          </Button>
          <Button
            variant='destructive'
            onClick={() => question && onReject(question.id)}
            disabled={isRejecting || question?.status === 'Rejected'}
          >
            {isRejecting ? 'Rejecting...' : 'Reject'}
          </Button>
          <Button
            variant='secondary'
            onClick={() => question && onRegenerate(question.id)}
            disabled={isRegenerating}
          >
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </Button>
          <Button
            onClick={() => question && onApprove(question.id)}
            disabled={isApproving || question?.status === 'APPROVED'}
          >
            {isApproving ? 'Approving...' : 'Approve'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
