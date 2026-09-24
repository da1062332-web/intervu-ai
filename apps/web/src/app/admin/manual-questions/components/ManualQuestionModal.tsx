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
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { useTopics } from '@/services/topics/hooks';
import { useConcepts } from '@/services/concept-mapping/hooks';
import { QuestionImageAttachment } from '@/components/media/QuestionImageAttachment';
import { ImagePreview } from '@/components/media/ImagePreview';
import { ImagePicker } from '@/components/media/ImagePicker';
import { ImageUploader } from '@/components/media/ImageUploader';
import { MediaAsset, OptionMode } from '@/services/media/types';
import toast from 'react-hot-toast';

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

export interface RichOptionState {
  key: string;
  mode: OptionMode;
  text: string;
  mediaId: string | null;
  mediaUrl: string | null;
}

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

  const [questionAttachment, setQuestionAttachment] = useState<{
    mediaId?: string;
    mediaUrl?: string;
    svgCode?: string;
    altText?: string;
  } | null>(null);

  const [richOptions, setRichOptions] = useState<RichOptionState[]>([
    { key: 'A', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
    { key: 'B', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
    { key: 'C', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
    { key: 'D', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
  ]);

  const [selectedCorrectIndex, setSelectedCorrectIndex] = useState<number>(0);
  const [pickerOptionIndex, setPickerOptionIndex] = useState<number | null>(null);
  const [uploaderOptionIndex, setUploaderOptionIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const targetQuestion = (detailedQuestion as any)?.data || (question as any)?.data || question;
      if (targetQuestion) {
        // Load question diagram attachment
        if (targetQuestion.questionMedia && targetQuestion.questionMedia.length > 0) {
          const qm = targetQuestion.questionMedia[0];
          if (qm.mediaAsset) {
            setQuestionAttachment({
              mediaId: qm.mediaAsset.id,
              mediaUrl: qm.mediaAsset.url,
              altText: qm.mediaAsset.altText || undefined,
            });
          }
        } else {
          setQuestionAttachment(null);
        }

        // Load MCQ options
        let rawOpts: any = (targetQuestion as any).mcqData?.options || targetQuestion.options;
        if (typeof rawOpts === 'string') {
          try {
            rawOpts = JSON.parse(rawOpts);
          } catch (e) {}
        }
        if (rawOpts && rawOpts.options && Array.isArray(rawOpts.options)) {
          rawOpts = rawOpts.options;
        }

        if (Array.isArray(rawOpts) && rawOpts.length > 0) {
          const parsedRich: RichOptionState[] = rawOpts.map((opt: any, idx: number) => {
            const letter = String.fromCharCode(65 + idx);
            if (typeof opt === 'object' && opt !== null) {
              const hasText = !!opt.text;
              const hasMedia = !!opt.mediaId;
              let mode: OptionMode = 'text-only';
              if (hasText && hasMedia) mode = 'diagram-text';
              else if (hasMedia && !hasText) mode = 'diagram-only';

              return {
                key: opt.key || letter,
                mode,
                text: opt.text || '',
                mediaId: opt.mediaId || null,
                mediaUrl: opt.mediaUrl || null,
              };
            } else {
              return {
                key: letter,
                mode: 'text-only',
                text: String(opt || ''),
                mediaId: null,
                mediaUrl: null,
              };
            }
          });

          while (parsedRich.length < 4) {
            const letter = String.fromCharCode(65 + parsedRich.length);
            parsedRich.push({ key: letter, mode: 'text-only', text: '', mediaId: null, mediaUrl: null });
          }

          setRichOptions(parsedRich);

          const correctIdx = parsedRich.findIndex(
            (o) =>
              (o.text && o.text.trim() === targetQuestion.answer?.trim()) ||
              o.key === targetQuestion.answer?.trim(),
          );
          setSelectedCorrectIndex(correctIdx >= 0 ? correctIdx : 0);
        } else {
          setRichOptions([
            { key: 'A', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
            { key: 'B', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
            { key: 'C', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
            { key: 'D', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
          ]);
          setSelectedCorrectIndex(0);
        }

        let qType = (targetQuestion.questionType || 'MCQ').toUpperCase();
        if (qType === 'MULTIPLE_CHOICE' || qType === 'MULTIPLE-CHOICE') {
          qType = 'MCQ';
        }

        reset({
          questionText: targetQuestion.questionText || '',
          answer: targetQuestion.answer || 'A',
          explanation: targetQuestion.explanation || '',
          difficulty: (targetQuestion.difficulty || 'MEDIUM').toUpperCase() as any,
          questionType: qType === 'CODING' || qType === 'TRUE_FALSE' ? (qType as any) : 'MCQ',
          topicId: targetQuestion.topicId || '',
          sectionId: targetQuestion.sectionId || '',
          conceptId: targetQuestion.conceptId || '',
          status: (targetQuestion.status || 'DRAFT').toUpperCase() as any,
        });
      } else {
        setQuestionAttachment(null);
        setRichOptions([
          { key: 'A', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
          { key: 'B', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
          { key: 'C', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
          { key: 'D', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
        ]);
        setSelectedCorrectIndex(0);
        reset({
          questionText: '',
          answer: 'A',
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

  const handleOptionModeChange = (index: number, mode: OptionMode) => {
    setRichOptions((prev: RichOptionState[]) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], mode };
      return updated;
    });
  };

  const handleOptionTextChange = (index: number, text: string) => {
    setRichOptions((prev: RichOptionState[]) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], text };
      return updated;
    });
    if (index === selectedCorrectIndex) {
      setValue('answer', text || richOptions[index].key);
    }
  };

  const handleOptionImageSelect = (index: number, asset: MediaAsset) => {
    setRichOptions((prev: RichOptionState[]) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        mediaId: asset.id,
        mediaUrl: asset.url,
      };
      return updated;
    });
    setPickerOptionIndex(null);
    setUploaderOptionIndex(null);
  };

  const handleOptionImageRemove = (index: number) => {
    setRichOptions((prev: RichOptionState[]) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        mediaId: null,
        mediaUrl: null,
      };
      return updated;
    });
  };

  const handleSelectCorrect = (index: number) => {
    setSelectedCorrectIndex(index);
    const opt = richOptions[index];
    const answerVal = opt.mode === 'diagram-only' ? opt.key : opt.text || opt.key;
    setValue('answer', answerVal);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const isMcq = data.questionType === 'MCQ';

      if (isMcq) {
        const missingOptions = richOptions.filter(
          (opt) => opt.mode !== 'diagram-only' && (!opt.text || !opt.text.trim()) && !opt.mediaId
        );
        if (missingOptions.length > 0) {
          toast.error(`Please provide text or diagram for Option ${missingOptions.map((o) => o.key).join(', ')}.`);
          return;
        }
      }

      const payloadRichOptions = isMcq
        ? richOptions.map((opt: RichOptionState) => ({
            key: opt.key,
            text: opt.mode === 'diagram-only' ? null : opt.text,
            mediaId: opt.mode === 'text-only' ? null : opt.mediaId,
          }))
        : undefined;

      const correctOpt = isMcq ? richOptions[selectedCorrectIndex] : null;
      const answerVal = isMcq
        ? correctOpt?.mode === 'diagram-only'
          ? correctOpt.key
          : correctOpt?.text || correctOpt?.key || data.answer
        : data.answer;

      const payload: any = {
        ...data,
        answer: answerVal,
        sectionId: data.sectionId || null,
        questionMediaId: questionAttachment?.mediaId || null,
      };

      if (isMcq) {
        payload.richOptions = payloadRichOptions;
        payload.options = richOptions.map((o: RichOptionState) => o.text || o.key);
      }

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
    <Modal isOpen={isOpen} onClose={onClose} className='max-w-3xl max-h-[90vh] overflow-y-auto'>
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
              className='min-h-[90px]'
              placeholder='Enter the question text here...'
              {...register('questionText')}
              disabled={isSubmitting}
            />
            {errors.questionText && (
              <p className='text-sm text-destructive'>{errors.questionText.message}</p>
            )}
          </div>

          {/* Question Diagram / Image Attachment */}
          <QuestionImageAttachment
            value={questionAttachment}
            onChange={(att) => setQuestionAttachment(att)}
            disabled={isSubmitting}
          />

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
                {topics.map((t: any) => (
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
                {concepts.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.conceptName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MCQ Option Fields with 3 Option Modes */}
          {questionType?.toUpperCase() === 'MCQ' ||
          questionType?.toUpperCase() === 'MULTIPLE_CHOICE' ? (
            <div className='space-y-3 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border'>
              <div className='flex items-center justify-between'>
                <Label className='text-sm font-semibold'>MCQ Options & Correct Answer *</Label>
                <span className='text-xs text-muted-foreground'>
                  Supports text, diagram, or text+diagram per option
                </span>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {richOptions.map((opt: RichOptionState, idx: number) => {
                  const isCorrect = selectedCorrectIndex === idx;
                  return (
                    <div
                      key={opt.key}
                      className={`p-3 border rounded-md bg-background transition-colors space-y-2.5 ${
                        isCorrect ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-input'
                      }`}
                    >
                      <div className='flex items-center justify-between'>
                        <span className='text-xs font-semibold px-2 py-0.5 rounded bg-muted'>
                          Option {opt.key}
                        </span>
                        <label className='flex items-center space-x-1.5 cursor-pointer text-xs'>
                          <input
                            type='radio'
                            name='correctOption'
                            checked={isCorrect}
                            onChange={() => handleSelectCorrect(idx)}
                            className='w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer'
                          />
                          <span className={isCorrect ? 'font-medium text-indigo-600' : 'text-muted-foreground'}>
                            Correct Answer
                          </span>
                        </label>
                      </div>

                      {/* Mode Selector */}
                      <div className='flex items-center space-x-2 text-xs'>
                        <span className='text-muted-foreground'>Mode:</span>
                        <select
                          className='flex h-7 rounded border border-input bg-background px-2 py-0 text-xs'
                          value={opt.mode}
                          onChange={(e) => handleOptionModeChange(idx, e.target.value as OptionMode)}
                          disabled={isSubmitting}
                        >
                          <option value='text-only'>Text Only</option>
                          <option value='diagram-only'>Diagram Only</option>
                          <option value='diagram-text'>Diagram + Text</option>
                        </select>
                      </div>

                      {/* Text Input */}
                      {opt.mode !== 'diagram-only' && (
                        <Input
                          value={opt.text}
                          onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                          placeholder={`Enter text for Option ${opt.key}...`}
                          disabled={isSubmitting}
                          className='text-xs h-8'
                        />
                      )}

                      {/* Diagram Input */}
                      {opt.mode !== 'text-only' && (
                        <div className='pt-1'>
                          {opt.mediaUrl ? (
                            <div className='flex items-center justify-between p-1.5 border rounded bg-muted/30'>
                              <ImagePreview url={opt.mediaUrl} onRemove={() => handleOptionImageRemove(idx)} disabled={isSubmitting} />
                            </div>
                          ) : (
                            <div className='flex items-center space-x-2'>
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                className='text-xs h-7 py-0 px-2'
                                onClick={() => setUploaderOptionIndex(idx)}
                                disabled={isSubmitting}
                              >
                                <Plus className='w-3 h-3 mr-1' /> Upload Diagram
                              </Button>
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                className='text-xs h-7 py-0 px-2'
                                onClick={() => setPickerOptionIndex(idx)}
                                disabled={isSubmitting}
                              >
                                Select Library
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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

        <ImagePicker
          isOpen={pickerOptionIndex !== null}
          onClose={() => setPickerOptionIndex(null)}
          onSelect={(asset) => {
            if (pickerOptionIndex !== null) {
              handleOptionImageSelect(pickerOptionIndex, asset);
            }
          }}
          selectedId={pickerOptionIndex !== null ? richOptions[pickerOptionIndex]?.mediaId : null}
        />

        <Modal
          isOpen={uploaderOptionIndex !== null}
          onClose={() => setUploaderOptionIndex(null)}
          className="max-w-md"
        >
          <div className="space-y-3 p-1">
            <h3 className="text-base font-semibold">Upload Option Diagram</h3>
            {uploaderOptionIndex !== null && (
              <ImageUploader
                onUploaded={(asset) => handleOptionImageSelect(uploaderOptionIndex, asset)}
                disabled={isSubmitting}
              />
            )}
          </div>
        </Modal>
      </div>
    </Modal>
  );
}
