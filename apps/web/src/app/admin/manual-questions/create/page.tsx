'use client';

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';

import { SharedConfigHeader } from '../components/SharedConfigHeader';
import { BatchQuestionList } from '../components/BatchQuestionList';
import { manualQuestionsApi } from '@/services/manual-questions/api';
import { useQueryClient } from '@tanstack/react-query';

const questionSchema = z.object({
  questionType: z.enum(['MCQ', 'CODING', 'TRUE_FALSE']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  questionTitle: z.string().optional(),
  questionText: z.string().optional(),
  options: z.array(z.string()).optional(),
  answer: z.string().optional(),
  explanation: z.string().optional(),
  mcqCorrectIndex: z.string().optional(),
  codingData: z.any().optional(),
}).superRefine((val, ctx) => {
  if (val.questionType !== 'CODING') {
    if (!val.questionText || val.questionText.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Question text is required',
        path: ['questionText']
      });
    }
    if (!val.answer || val.answer.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Answer is required',
        path: ['answer']
      });
    }
  }
});

const formSchema = z.object({
  topicId: z.string().min(1, 'Topic is required'),
  conceptId: z.string().min(1, 'Concept is required'),
  sectionId: z.string().optional().nullable(),
  questions: z.array(questionSchema).min(1, 'Add at least one question'),
});

type FormValues = z.infer<typeof formSchema>;

export default function BatchCreatePage() {
  return (
    <React.Suspense fallback={<div className="p-8 flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>}>
      <BatchCreateContent />
    </React.Suspense>
  );
}

function BatchCreateContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultTopicId = searchParams.get('topicId') || '';
  const defaultConceptId = searchParams.get('conceptId') || '';

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topicId: defaultTopicId,
      conceptId: defaultConceptId,
      sectionId: '',
      questions: [
        {
          questionType: 'MCQ',
          difficulty: 'MEDIUM',
          questionTitle: '',
          questionText: '',
          options: ['', '', '', ''],
          answer: '',
          explanation: '',
        }
      ],
    },
  });

  const { handleSubmit, watch, setValue, formState: { errors } } = methods;

  const topicId = watch('topicId');
  const conceptId = watch('conceptId');

  const onSubmit = async (data: FormValues, status: 'DRAFT' | 'ACTIVE') => {
    setIsSubmitting(true);

    const payloads = data.questions.map((q) => {
      // Clean up empty options
      const filteredOptions = q.options?.filter(opt => opt && opt.trim() !== '') || [];
      
      const isCoding = q.questionType === 'CODING';
      const questionText = isCoding 
        ? (q.codingData?.problemStatement || 'Coding Challenge') 
        : (q.questionText || '');
      const answer = isCoding
        ? (q.codingData?.referenceSolution || 'Code solution provided')
        : (q.answer || '');

      return {
        questionText: questionText,
        answer: answer,
        explanation: q.explanation || '',
        topicId: data.topicId,
        sectionId: data.sectionId || null,
        difficulty: q.difficulty,
        source: "MANUAL" as const,
        templateId: null,
        options: filteredOptions,
        conceptId: data.conceptId,
        questionSource: "MANUAL" as const,
        questionType: q.questionType,
        estimatedTime: 120,
        questionTitle: q.questionTitle || '',
        questionStatement: isCoding ? (q.codingData?.problemStatement || '') : '',
        instructions: isCoding ? JSON.stringify({
          starterCode: q.codingData?.starterCode || '',
          constraints: q.codingData?.constraints || '',
          testCases: q.codingData?.testCases || ''
        }) : '',
        questionImage: '',
        status: status, // status is required for Draft/Publish state
      };
    });

    try {
      const results = await Promise.allSettled(
        payloads.map(payload => manualQuestionsApi.createQuestion(payload))
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        toast.success(`Successfully saved ${successCount} questions as ${status}.`);
      } else {
        toast.error(`Saved ${successCount} questions. ${failCount} failed.`);
      }

      queryClient.invalidateQueries({ queryKey: ['manual-questions'] });
      
      const returnTo = searchParams.get('returnTo');
      if (successCount > 0) {
        if (returnTo) {
          router.push(returnTo);
        } else {
          router.push('/admin/manual-questions');
        }
      }
    } catch (err) {
      toast.error('An error occurred while saving questions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const returnTo = searchParams.get('returnTo');
    if (returnTo) {
      router.push(returnTo);
    } else {
      router.push('/admin/manual-questions');
    }
  };

  return (
    <div className='flex-1 space-y-4 max-w-5xl mx-auto w-full'>
      <div className='flex items-center space-x-4 mb-6'>
        <Button variant='ghost' size='icon' onClick={handleCancel} disabled={isSubmitting}>
          <ArrowLeft className='w-5 h-5' />
        </Button>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Batch Question Builder</h2>
          <p className='text-muted-foreground mt-1'>
            Create multiple manual questions for a specific topic and concept.
          </p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form className="space-y-8 pb-20" noValidate>
          
          <SharedConfigHeader 
            topicId={topicId}
            conceptId={conceptId}
            onTopicChange={(id) => setValue('topicId', id, { shouldValidate: true })}
            onConceptChange={(id) => setValue('conceptId', id, { shouldValidate: true })}
            onSectionResolved={(id) => setValue('sectionId', id)}
            disabled={isSubmitting}
          />

          {(errors.topicId || errors.conceptId) && (
            <div className="text-sm text-destructive">
              Please select both a Topic and a Concept before proceeding.
            </div>
          )}

          <div className="space-y-4">
            <BatchQuestionList />
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSubmit((data) => onSubmit(data, 'DRAFT'))} 
              disabled={isSubmitting}
            >
              Save Draft
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit((data) => onSubmit(data, 'ACTIVE'))} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...
                </>
              ) : 'Publish'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
