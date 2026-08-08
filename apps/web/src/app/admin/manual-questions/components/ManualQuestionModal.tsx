import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useCreateManualQuestion,
  useUpdateManualQuestion,
  useManualQuestion,
} from '@/services/manual-questions/hooks';
import { ManualQuestion } from '@/services/manual-questions/types';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { useTopics } from '@/services/topics/hooks';
import { useConcepts } from '@/services/concept-mapping/hooks';

const formSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  answer: z.string().min(1, 'Answer is required'),
  explanation: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  questionType: z.enum(['MCQ', 'CODING', 'TRUE_FALSE']),
  topicId: z.string().min(1, 'Topic is required'),
  sectionId: z.string().optional().nullable(),
  conceptId: z.string().optional(),
  status: z.enum(['DRAFT', 'VALIDATED', 'ACTIVE', 'ARCHIVED']),
  options: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ManualQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question?: ManualQuestion | null;
  initialTopicId?: string;
  initialConceptId?: string;
}

export function ManualQuestionModal({
  isOpen,
  onClose,
  question,
  initialTopicId,
  initialConceptId,
}: ManualQuestionModalProps) {
  const isEditing = !!question;
  const { data: detailedQuestion, isLoading: isFetchingDetail } = useManualQuestion(
    question?.id || '',
  );
  const { mutateAsync: createQuestion, isPending: isCreating } = useCreateManualQuestion();
  const { mutateAsync: updateQuestion, isPending: isUpdating } = useUpdateManualQuestion();
  const isSubmitting = isCreating || isUpdating || isFetchingDetail;

  const { data: topics = [], isLoading: isLoadingTopics } = useTopics();

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
      options: ['', '', '', ''],
    },
  });

  const difficulty = watch('difficulty');
  const questionType = watch('questionType');
  const status = watch('status');
  const topicId = watch('topicId');
  const conceptId = watch('conceptId');

  const { data: concepts = [], isLoading: isLoadingConcepts } = useConcepts(topicId, true);

  const [mcqOptions, setMcqOptions] = useState<string[]>(['', '', '', '']);
  const [selectedCorrectIndex, setSelectedCorrectIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      const targetQuestion = (detailedQuestion as any)?.data || (question as any)?.data || question;
      if (targetQuestion) {
        let rawOpts: any = targetQuestion.options;
        if (!rawOpts || !Array.isArray(rawOpts) || rawOpts.length === 0) {
          rawOpts = (targetQuestion as any).mcqData?.options || (targetQuestion as any).mcqData;
        }
        if (typeof rawOpts === 'string') {
          try {
            rawOpts = JSON.parse(rawOpts);
          } catch (e) {}
        }
        if (rawOpts && rawOpts.options && Array.isArray(rawOpts.options)) {
          rawOpts = rawOpts.options;
        }

        let opts =
          Array.isArray(rawOpts) && rawOpts.length > 0
            ? rawOpts.map((o: any) => String(o))
            : ['', '', '', ''];
        while (opts.length < 4) {
          opts.push('');
        }

        setMcqOptions(opts);
        const correctIdx = opts.findIndex((o) => o && o.trim() === targetQuestion.answer?.trim());
        setSelectedCorrectIndex(correctIdx >= 0 ? correctIdx : 0);

        let qType = (targetQuestion.questionType || 'MCQ').toUpperCase();
        if (qType === 'MULTIPLE_CHOICE' || qType === 'MULTIPLE-CHOICE') {
          qType = 'MCQ';
        }

        reset({
          questionText: targetQuestion.questionText || '',
          answer: targetQuestion.answer || '',
          explanation: targetQuestion.explanation || '',
          difficulty: (targetQuestion.difficulty || 'MEDIUM').toUpperCase() as any,
          questionType: qType === 'CODING' || qType === 'TRUE_FALSE' ? (qType as any) : 'MCQ',
          topicId: targetQuestion.topicId || '',
          sectionId: targetQuestion.sectionId || '',
          conceptId: targetQuestion.conceptId || '',
          status: (targetQuestion.status || 'DRAFT').toUpperCase() as any,
          options: opts,
        });
      } else {
        setMcqOptions(['', '', '', '']);
        setSelectedCorrectIndex(0);
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
          options: ['', '', '', ''],
        });
      }
    }
  }, [isOpen, question, detailedQuestion, initialTopicId, initialConceptId, reset]);

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...mcqOptions];
    updated[index] = val;
    setMcqOptions(updated);
    setValue('options', updated);
    if (index === selectedCorrectIndex) {
      setValue('answer', val);
    }
  };

  const handleSelectCorrect = (index: number) => {
    setSelectedCorrectIndex(index);
    setValue('answer', mcqOptions[index] || '');
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const isMcq = data.questionType === 'MCQ';
      const cleanOptions = isMcq ? mcqOptions.filter((o) => o && o.trim() !== '') : [];
      const answerVal = isMcq ? mcqOptions[selectedCorrectIndex] || data.answer : data.answer;

      const payload = {
        ...data,
        answer: answerVal,
        options: cleanOptions,
        sectionId: data.sectionId || null,
      };

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
          <h3 className='text-lg font-medium'>
            {isEditing ? 'Edit Manual Question' : 'Add Manual Question'}
          </h3>
          <p className='text-sm text-muted-foreground'>
            {isEditing ? 'Update the question details.' : 'Create a new manual question.'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4' noValidate>
          <div className='space-y-2'>
            <Label htmlFor='questionText'>Question Text *</Label>
            <Textarea
              id='questionText'
              className='min-h-[100px]'
              placeholder='Enter the question text here...'
              {...register('questionText')}
              disabled={isSubmitting}
            />
            {errors.questionText && (
              <p className='text-sm text-destructive'>{errors.questionText.message}</p>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Type</Label>
              <select
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                value={questionType}
                onChange={(e) => setValue('questionType', e.target.value as any)}
                disabled={isSubmitting}
              >
                <option value='MCQ'>Multiple Choice (MCQ)</option>
                <option value='TRUE_FALSE'>True / False</option>
                <option value='CODING'>Coding</option>
              </select>
            </div>
            <div className='space-y-2'>
              <Label>Difficulty</Label>
              <select
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                value={difficulty}
                onChange={(e) => setValue('difficulty', e.target.value as any)}
                disabled={isSubmitting}
              >
                <option value='EASY'>Easy</option>
                <option value='MEDIUM'>Medium</option>
                <option value='HARD'>Hard</option>
              </select>
            </div>
          </div>

          {/* Topic & Concept Selector Dropdowns */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='topicId'>Topic *</Label>
              <select
                id='topicId'
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                value={topicId}
                onChange={(e) => {
                  setValue('topicId', e.target.value, { shouldValidate: true });
                  setValue('conceptId', '');
                }}
                disabled={isSubmitting || isLoadingTopics}
              >
                <option value=''>
                  {isLoadingTopics ? 'Loading topics...' : 'Select Topic...'}
                </option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {errors.topicId && (
                <p className='text-sm text-destructive'>{errors.topicId.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='conceptId'>Concept (Optional)</Label>
              <select
                id='conceptId'
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                value={conceptId}
                onChange={(e) => setValue('conceptId', e.target.value)}
                disabled={isSubmitting || !topicId || isLoadingConcepts}
              >
                <option value=''>
                  {!topicId
                    ? 'Select a topic first'
                    : isLoadingConcepts
                      ? 'Loading concepts...'
                      : 'Select Concept...'}
                </option>
                {concepts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.conceptName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MCQ Option Fields */}
          {questionType?.toUpperCase() === 'MCQ' ||
          questionType?.toUpperCase() === 'MULTIPLE_CHOICE' ? (
            <div className='space-y-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border'>
              <Label className='text-sm font-semibold'>MCQ Options & Correct Answer *</Label>
              <p className='text-xs text-muted-foreground mb-2'>
                Enter the 4 options below and select the radio button next to the correct answer.
              </p>
              {mcqOptions.map((optVal, idx) => (
                <div key={idx} className='flex items-center space-x-2'>
                  <input
                    type='radio'
                    name='correctOption'
                    checked={selectedCorrectIndex === idx}
                    onChange={() => handleSelectCorrect(idx)}
                    className='w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer'
                  />
                  <Input
                    value={optVal}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    disabled={isSubmitting}
                  />
                </div>
              ))}
              {errors.answer && <p className='text-sm text-destructive'>{errors.answer.message}</p>}
            </div>
          ) : (
            <div className='space-y-2'>
              <Label htmlFor='answer'>Answer / Solution *</Label>
              <Textarea
                id='answer'
                className='min-h-[60px]'
                placeholder='Enter the correct answer or code solution...'
                {...register('answer')}
                disabled={isSubmitting}
              />
              {errors.answer && <p className='text-sm text-destructive'>{errors.answer.message}</p>}
            </div>
          )}

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
              <Label htmlFor='sectionId'>
                Section{' '}
                {(((detailedQuestion as any)?.data || question) as any)?.section?.name
                  ? `(${(((detailedQuestion as any)?.data || question) as any).section.name})`
                  : '(Optional)'}
              </Label>
              <Input
                id='sectionId'
                placeholder='Section name or ID...'
                {...register('sectionId')}
                disabled={isSubmitting}
              />
            </div>
            <div className='space-y-2'>
              <Label>Status</Label>
              <select
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                value={status}
                onChange={(e) => setValue('status', e.target.value as any)}
                disabled={isSubmitting}
              >
                <option value='DRAFT'>Draft</option>
                <option value='ACTIVE'>Active</option>
                <option value='ARCHIVED'>Archived</option>
              </select>
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
