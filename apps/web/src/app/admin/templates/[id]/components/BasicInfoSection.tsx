import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { TemplateSection } from './TemplateSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Zap } from 'lucide-react';
import { useUpdateTemplate } from '@/services/templates/hooks';
import type { GenerationStrategy } from '@/services/question-generation/types';
import { useStrategyConfigStore } from '@/store/strategy-config.store';
import { STRATEGY_LABELS, STRATEGY_DESCRIPTIONS } from '../registry/strategy-panel.registry';

interface BasicInfoForm {
  name: string;
  description: string;
  conceptKey: string;
  difficulty: string;
  questionType: string;
  status: string;
  tags: string;
  generationStrategy: GenerationStrategy;
  datasetGenerationMode: 'AI' | 'DIRECT';
}

interface BasicInfoSectionProps {
  template: any;
}

export function BasicInfoSection({ template }: BasicInfoSectionProps) {
  const { mutate: updateTemplate, isPending: isSaving } = useUpdateTemplate();
  const { currentStrategy, setStrategy } = useStrategyConfigStore();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BasicInfoForm>({
    defaultValues: {
      name: template?.name || '',
      description: template?.description || '',
      conceptKey: template?.conceptKey || '',
      difficulty: template?.difficultyLevel || template?.difficulty || 'MEDIUM',
      questionType: template?.questionType || 'coding',
      status: template?.isActive ? 'Active' : 'Draft',
      tags: '',
      generationStrategy: template?.generationStrategy || 'VARIABLE',
      datasetGenerationMode:
        template?.datasetGenerationMode ||
        template?.config?.datasetGenerationMode ||
        template?.datasetConfig?.datasetGenerationMode ||
        'AI',
    },
  });

  // Sync Zustand store when strategy field changes
  const watchedStrategy = watch('generationStrategy');
  React.useEffect(() => {
    if (watchedStrategy && watchedStrategy !== currentStrategy) {
      setStrategy(watchedStrategy as GenerationStrategy);
    }
  }, [watchedStrategy]);

  useEffect(() => {
    if (template) {
      reset({
        name: template.name || '',
        description: template.description || '',
        conceptKey: template.conceptKey || '',
        difficulty: template.difficultyLevel || template.difficulty || 'MEDIUM',
        questionType: template.questionType || 'coding',
        status: template.isActive ? 'Active' : 'Draft',
        tags: '',
        generationStrategy: template.generationStrategy || 'VARIABLE',
        datasetGenerationMode:
          template.datasetGenerationMode ||
          template.config?.datasetGenerationMode ||
          template.datasetConfig?.datasetGenerationMode ||
          'AI',
      });
    }
  }, [template, reset]);

  const onSubmit = (data: BasicInfoForm) => {
    if (!template?.id) return;

    const currentConfig = (template?.config as Record<string, any>) || {};
    updateTemplate({
      templateId: template.id,
      payload: {
        name: data.name,
        description: data.description,
        conceptKey: data.conceptKey,
        difficulty: data.difficulty,
        questionType: data.questionType,
        isActive: data.status === 'Active',
        generationStrategy: data.generationStrategy,
        datasetGenerationMode: data.datasetGenerationMode,
        config: {
          ...currentConfig,
          datasetGenerationMode: data.datasetGenerationMode,
        },
      },
    });
  };

  return (
    <TemplateSection
      title='Basic Information'
      description='Update the fundamental details and metadata for this template.'
      actions={
        <Button onClick={handleSubmit(onSubmit)} disabled={isSaving}>
          {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Save Settings
        </Button>
      }
    >
      <form className='space-y-6 max-w-2xl' onSubmit={handleSubmit(onSubmit)}>
        <div className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Template Name */}
            <div className='space-y-2'>
              <Label htmlFor='name' className={errors.name ? 'text-red-500' : ''}>
                Template Name *
              </Label>
              <Input
                id='name'
                {...register('name', { required: 'Template Name is required' })}
                aria-invalid={errors.name ? 'true' : 'false'}
                className={errors.name ? 'border-red-500' : ''}
                placeholder='e.g. React Custom Hook'
              />
              {errors.name && <p className='text-sm text-red-500'>{errors.name.message}</p>}
            </div>

            {/* Concept Ownership */}
            <div className='space-y-2'>
              <Label htmlFor='conceptKey' className={errors.conceptKey ? 'text-red-500' : ''}>
                Concept * (Parent Entity)
              </Label>
              <Input
                id='conceptKey'
                {...register('conceptKey', {
                  required: 'Concept is required. A Template cannot exist without a Concept.',
                })}
                aria-invalid={errors.conceptKey ? 'true' : 'false'}
                className={errors.conceptKey ? 'border-red-500' : ''}
                placeholder='e.g. react_hooks'
              />
              {errors.conceptKey && (
                <p className='text-sm text-red-500'>{errors.conceptKey.message}</p>
              )}
              <p className='text-xs text-muted-foreground'>
                The selected Concept acts as the parent context for Variables and Constraints.
              </p>
            </div>
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <textarea
              id='description'
              {...register('description')}
              className='flex min-h-[80px] w-full rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              placeholder='Briefly describe what this template assesses...'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Difficulty */}
            <div className='space-y-2'>
              <Label htmlFor='difficulty'>Difficulty</Label>
              <select
                id='difficulty'
                {...register('difficulty')}
                className='flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                <option value='EASY'>EASY</option>
                <option value='MEDIUM'>MEDIUM</option>
                <option value='HARD'>HARD</option>
              </select>
            </div>

            {/* Question Type */}
            <div className='space-y-2'>
              <Label htmlFor='questionType' className={errors.questionType ? 'text-red-500' : ''}>
                Question Type *
              </Label>
              <select
                id='questionType'
                {...register('questionType', { required: 'Question Type is required' })}
                className='flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                <option value='MULTIPLE_CHOICE'>Multiple Choice (MCQ)</option>
                <option value='CODING'>Coding Problem</option>
                <option value='NUMERIC'>Numeric Entry</option>
                <option value='TRUE_FALSE'>True / False</option>
              </select>
              {errors.questionType && (
                <p className='text-sm text-red-500'>{errors.questionType.message}</p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Status */}
            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <select
                id='status'
                {...register('status')}
                className='flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                <option value='Draft'>Draft</option>
                <option value='Active'>Active</option>
                <option value='Archived'>Archived</option>
              </select>
            </div>

            {/* Tags Placeholder */}
            <div className='space-y-2'>
              <Label htmlFor='tags'>Tags (Optional)</Label>
              <Input id='tags' {...register('tags')} placeholder='e.g. frontend, react' />
            </div>
          </div>

          {/* Dataset Generation Mode (Visible when strategy is DATASET) */}
          {(watchedStrategy === 'DATASET' || currentStrategy === 'DATASET') && (
            <div className='space-y-2 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg'>
              <Label
                htmlFor='datasetGenerationMode'
                className='font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-2'
              >
                <Zap className='w-4 h-4 text-indigo-600 dark:text-indigo-400' />
                Dataset Generation Mode *
              </Label>
              <select
                id='datasetGenerationMode'
                {...register('datasetGenerationMode')}
                className='flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium'
              >
                <option value='AI'>AI Mode (Generate new question via AI)</option>
                <option value='DIRECT'>Direct Mode (Fetch directly from dataset)</option>
              </select>
              <p className='text-xs text-indigo-700 dark:text-indigo-300 font-normal'>
                {watch('datasetGenerationMode') === 'DIRECT'
                  ? '⚡ Fetches raw questions directly from dataset without calling AI.'
                  : '🤖 Generates a brand-new question using dataset concept as reference.'}
              </p>
            </div>
          )}

          {/* Version Read-only */}
          <div className='space-y-2 pt-2'>
            <Label>Template Version</Label>
            <div>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'>
                v1.0 (Read-only)
              </span>
            </div>
          </div>
        </div>
      </form>
    </TemplateSection>
  );
}
