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
      });
    }
  }, [template, reset]);

  const onSubmit = (data: BasicInfoForm) => {
    if (!template?.id) return;
    
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
      }
    });
  };

  return (
    <TemplateSection
      title="Basic Information"
      description="Update the fundamental details and metadata for this template."
      actions={
        <Button onClick={handleSubmit(onSubmit)} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      }
    >
      <form className="space-y-6 max-w-2xl" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className={errors.name ? "text-red-500" : ""}>
                Template Name *
              </Label>
              <Input
                id="name"
                {...register('name', { required: 'Template Name is required' })}
                aria-invalid={errors.name ? "true" : "false"}
                className={errors.name ? "border-red-500" : ""}
                placeholder="e.g. React Custom Hook"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Concept Ownership */}
            <div className="space-y-2">
              <Label htmlFor="conceptKey" className={errors.conceptKey ? "text-red-500" : ""}>
                Concept * (Parent Entity)
              </Label>
              <Input
                id="conceptKey"
                {...register('conceptKey', { required: 'Concept is required. A Template cannot exist without a Concept.' })}
                aria-invalid={errors.conceptKey ? "true" : "false"}
                className={errors.conceptKey ? "border-red-500" : ""}
                placeholder="e.g. react_hooks"
              />
              {errors.conceptKey && (
                <p className="text-sm text-red-500">{errors.conceptKey.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The selected Concept acts as the parent context for Variables and Constraints.
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              className="flex min-h-[80px] w-full rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Briefly describe what this template assesses..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Difficulty */}
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <select
                id="difficulty"
                {...register('difficulty')}
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>

            {/* Question Type */}
            <div className="space-y-2">
              <Label htmlFor="questionType" className={errors.questionType ? "text-red-500" : ""}>
                Question Type *
              </Label>
              <Input
                id="questionType"
                {...register('questionType', { required: 'Question Type is required' })}
                aria-invalid={errors.questionType ? "true" : "false"}
                className={errors.questionType ? "border-red-500" : ""}
                placeholder="e.g. coding"
              />
              {errors.questionType && (
                <p className="text-sm text-red-500">{errors.questionType.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...register('status')}
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            {/* Tags Placeholder */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <Input
                id="tags"
                {...register('tags')}
                placeholder="e.g. frontend, react"
              />
            </div>
          </div>

          {/* Generation Strategy */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" />
              <Label htmlFor="generationStrategy" className="text-sm font-semibold">
                Generation Strategy
              </Label>
            </div>
            <p className="text-xs text-gray-500">
              Determines how question instances are generated for this template.
              Changing strategy will update the Strategy Configuration section.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['VARIABLE', 'DATASET', 'HYBRID'] as GenerationStrategy[]).map((s) => (
                <label
                  key={s}
                  htmlFor={`strategy-${s}`}
                  className={`flex flex-col gap-1 p-3 border rounded-lg cursor-pointer transition-colors ${
                    watchedStrategy === s
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      id={`strategy-${s}`}
                      type="radio"
                      value={s}
                      {...register('generationStrategy')}
                      className="accent-indigo-600"
                    />
                    <span className="text-sm font-medium">{STRATEGY_LABELS[s]}</span>
                  </div>
                  <span className="text-xs text-gray-500 pl-5">
                    {STRATEGY_DESCRIPTIONS[s]}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Version Read-only */}
          <div className="space-y-2 pt-2">
            <Label>Template Version</Label>
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                v1.0 (Read-only)
              </span>
            </div>
          </div>
        </div>
      </form>
    </TemplateSection>
  );
}
