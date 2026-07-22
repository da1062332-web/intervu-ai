import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateManualQuestion, useUpdateManualQuestion, useManualQuestion } from '@/services/manual-questions/hooks';
import { ManualQuestion } from '@/services/manual-questions/types';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  answer: z.string().min(1, 'Answer is required'),
  explanation: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  questionType: z.enum(['MCQ', 'CODING', 'TRUE_FALSE']),
  topicId: z.string().min(1, 'Topic ID is required'),
  sectionId: z.string().optional().nullable(),
  conceptId: z.string().optional(),
  status: z.enum(['DRAFT', 'VALIDATED', 'ACTIVE', 'ARCHIVED']),
});

type FormValues = z.infer<typeof formSchema>;

interface ManualQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question?: ManualQuestion | null;
  initialTopicId?: string;
  initialConceptId?: string;
}

export function ManualQuestionModal({ isOpen, onClose, question, initialTopicId, initialConceptId }: ManualQuestionModalProps) {
  const isEditing = !!question;
  const { data: detailedQuestion, isLoading: isFetchingDetail } = useManualQuestion(question?.id || '');
  const { mutateAsync: createQuestion, isPending: isCreating } = useCreateManualQuestion();
  const { mutateAsync: updateQuestion, isPending: isUpdating } = useUpdateManualQuestion();
  const isSubmitting = isCreating || isUpdating || isFetchingDetail;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      questionText: '',
      answer: '',
      explanation: '',
      difficulty: 'MEDIUM',
      questionType: 'MCQ',
      topicId: '',
      sectionId: '',
      conceptId: '',
      status: 'DRAFT',
    },
  });

  const difficulty = watch('difficulty');
  const questionType = watch('questionType');
  const status = watch('status');

  useEffect(() => {
    if (isOpen) {
      const targetQuestion = detailedQuestion || question;
      if (targetQuestion) {
        reset({
          questionText: targetQuestion.questionText || '',
          answer: targetQuestion.answer || '',
          explanation: targetQuestion.explanation || '',
          difficulty: targetQuestion.difficulty || 'MEDIUM',
          questionType: targetQuestion.questionType || 'MCQ',
          topicId: targetQuestion.topicId || '',
          sectionId: targetQuestion.sectionId || '',
          conceptId: targetQuestion.conceptId || '',
          status: targetQuestion.status || 'DRAFT',
        });
      } else {
        reset({
          questionText: '',
          answer: '',
          explanation: '',
          difficulty: 'MEDIUM',
          questionType: 'MCQ',
          topicId: initialTopicId || '',
          sectionId: '',
          conceptId: initialConceptId || '',
          status: 'ACTIVE',
        });
      }
    }
  }, [isOpen, question, detailedQuestion, initialTopicId, initialConceptId, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = { ...data, sectionId: data.sectionId || null };
      if (isEditing && question) {
        await updateQuestion({ id: question.id, payload, currentStatus: question.status });
      } else {
        await createQuestion(payload as any);
      }
      onClose();
    } catch {
      // Errors are handled by react-query onError toast
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className='max-w-2xl max-h-[90vh] overflow-y-auto'>
      <div className='space-y-6 p-1'>
        <div>
          <h3 className='text-lg font-medium'>{isEditing ? 'Edit Manual Question' : 'Add Manual Question'}</h3>
          <p className='text-sm text-muted-foreground'>
            {isEditing ? 'Update the question details.' : 'Create a new manual question.'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4' noValidate>
          <div className='space-y-2'>
            <Label htmlFor='questionText'>Question Text</Label>
            <Textarea
              id='questionText'
              className='min-h-[100px]'
              placeholder='Enter the question text here...'
              {...register('questionText')}
              disabled={isSubmitting}
            />
            {errors.questionText && <p className='text-sm text-destructive'>{errors.questionText.message}</p>}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Type</Label>
              <Select
                value={questionType}
                onValueChange={(val: string) => setValue('questionType', val as any)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='MCQ'>Multiple Choice</SelectItem>
                  <SelectItem value='TRUE_FALSE'>True / False</SelectItem>
                  <SelectItem value='CODING'>Coding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(val: string) => setValue('difficulty', val as any)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select Difficulty' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='EASY'>Easy</SelectItem>
                  <SelectItem value='MEDIUM'>Medium</SelectItem>
                  <SelectItem value='HARD'>Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='answer'>Answer / Correct Option</Label>
            <Textarea
              id='answer'
              className='min-h-[60px]'
              placeholder='e.g. Option A, or the solution code...'
              {...register('answer')}
              disabled={isSubmitting}
            />
            {errors.answer && <p className='text-sm text-destructive'>{errors.answer.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='explanation'>Explanation (Optional)</Label>
            <Textarea
              id='explanation'
              className='min-h-[60px]'
              placeholder='Explain the answer...'
              {...register('explanation')}
              disabled={isSubmitting}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='topicId'>Topic ID</Label>
              <Input
                id='topicId'
                placeholder='e.g. topic-123'
                {...register('topicId')}
                disabled={isSubmitting}
              />
              {errors.topicId && <p className='text-sm text-destructive'>{errors.topicId.message}</p>}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='sectionId'>Section ID</Label>
              <Input
                id='sectionId'
                placeholder='e.g. section-123'
                {...register('sectionId')}
                disabled={isSubmitting}
              />
              {errors.sectionId && <p className='text-sm text-destructive'>{errors.sectionId.message}</p>}
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='conceptId'>Concept ID (Optional)</Label>
              <Input
                id='conceptId'
                placeholder='e.g. concept-123'
                {...register('conceptId')}
                disabled={isSubmitting}
              />
            </div>
            <div className='space-y-2'>
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(val: string) => setValue('status', val as any)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='DRAFT'>Draft</SelectItem>
                  <SelectItem value='ACTIVE'>Active</SelectItem>
                  <SelectItem value='ARCHIVED'>Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='pt-4 flex items-center justify-end space-x-2 border-t'>
            <Button type='button' variant='outline' onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
              {isEditing ? 'Save Changes' : 'Create Question'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
