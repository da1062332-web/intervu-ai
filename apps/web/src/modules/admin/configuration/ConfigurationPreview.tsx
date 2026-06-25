'use client';

import React from 'react';
import {
  useConfigPreview,
  usePublishConfig,
  useValidateConfig,
  useConfigValidation,
} from '@/services/exam-configs';
import { ExamSummary } from './ExamSummary';
import { SectionSummary } from './SectionSummary';
import { DifficultySummary } from './DifficultySummary';
import { TopicSummary } from './TopicSummary';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Upload, Loader2, AlertTriangle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useConfig } from '@/services/exam-configs';
import { Modal } from '@/components/ui/modal';

interface ConfigurationPreviewProps {
  configId: string;
}

/**
 * Task Group 7 — ConfigurationPreview
 * Shows a complete downstream impact preview and provides Validate + Publish actions.
 */
export function ConfigurationPreview({ configId }: ConfigurationPreviewProps) {
  const router = useRouter();
  const { data: preview, isLoading: isLoadingPreview } = useConfigPreview(configId);
  const { data: config } = useConfig(configId);
  const validateMutation = useValidateConfig(configId);
  const publishMutation = usePublishConfig(configId);

  const { data: validationResult } = useConfigValidation(configId);
  const [showPublishConfirm, setShowPublishConfirm] = React.useState(false);

  const handleValidate = async () => {
    await validateMutation.mutateAsync();
  };

  const handlePublish = async () => {
    await publishMutation.mutateAsync();
    setShowPublishConfirm(false);
    // Route push will happen, or just stay to view version
  };

  if (isLoadingPreview) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-32 w-full rounded-xl' />
        <Skeleton className='h-48 w-full rounded-xl' />
        <Skeleton className='h-40 w-full rounded-xl' />
      </div>
    );
  }

  if (!preview) {
    return (
      <div className='text-center py-12 border rounded-lg text-muted-foreground'>
        <p className='text-sm'>Preview not available.</p>
      </div>
    );
  }

  const isPublished = config?.status === 'PUBLISHED' || config?.status === 'ACTIVE';

  return (
    <div className='space-y-6 max-w-4xl'>
      {/* Exam Summary */}
      <ExamSummary
        name={preview.name}
        role={preview.role}
        durationMinutes={preview.durationMinutes}
        totalQuestions={preview.questions}
        status={config?.status}
        code={config?.code}
      />

      {/* Difficulty */}
      <DifficultySummary
        easy={preview.difficulty.easy}
        medium={preview.difficulty.medium}
        hard={preview.difficulty.hard}
        totalQuestions={preview.questions}
      />

      {/* Sections */}
      <SectionSummary sections={preview.sectionBreakdown} totalQuestions={preview.questions} />

      {/* Topics */}
      <TopicSummary sections={preview.sectionBreakdown} />

      {/* Validation Result */}
      {validationResult && (
        <div
          className={`rounded-xl border p-4 ${
            validationResult.valid
              ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/10'
              : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/10'
          }`}
        >
          <div className='flex items-center gap-2 mb-3'>
            {validationResult.valid ? (
              <CheckCircle2 className='w-4 h-4 text-green-600 dark:text-green-400' />
            ) : (
              <AlertTriangle className='w-4 h-4 text-red-500' />
            )}
            <span
              className={`text-sm font-semibold ${validationResult.valid ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}
            >
              {validationResult.valid
                ? 'Configuration is valid — ready to publish'
                : 'Validation failed'}
            </span>
          </div>
          {validationResult.errors.length > 0 && (
            <ul className='space-y-1 mb-3'>
              {validationResult.errors.map((err: string, i: number) => (
                <li
                  key={i}
                  className='text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5'
                >
                  <XCircle className='w-4 h-4 shrink-0 mt-0.5' />
                  <span>{err}</span>
                </li>
              ))}
            </ul>
          )}
          {validationResult.warnings.length > 0 && (
            <ul className='space-y-1'>
              {validationResult.warnings.map((w: string, i: number) => (
                <li
                  key={i}
                  className='text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5'
                >
                  <AlertTriangle className='w-4 h-4 shrink-0 mt-0.5' />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Actions */}
      <div className='flex items-center gap-3 pt-4 border-t'>
        {!isPublished && (
          <Button
            variant='outline'
            onClick={handleValidate}
            disabled={validateMutation.isPending}
            className='gap-2'
          >
            {validateMutation.isPending ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <CheckCircle2 className='w-4 h-4' />
            )}
            {validateMutation.isPending ? 'Validating...' : 'Run Validation'}
          </Button>
        )}

        <div className='flex flex-col gap-1'>
          <Button
            onClick={() => setShowPublishConfirm(true)}
            disabled={
              publishMutation.isPending ||
              isPublished ||
              !validationResult ||
              !validationResult.valid
            }
            className='gap-2'
            size='lg'
          >
            {publishMutation.isPending ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <Upload className='w-4 h-4' />
            )}
            {isPublished
              ? 'Already Published'
              : publishMutation.isPending
                ? 'Publishing...'
                : 'Publish Configuration'}
          </Button>
          {!isPublished && !validationResult && (
            <span className='text-xs text-muted-foreground ml-1'>
              Run validation before publishing.
            </span>
          )}
        </div>

        {isPublished && (
          <div className='flex items-center gap-2 text-sm text-green-600 dark:text-green-400'>
            <CheckCircle2 className='w-4 h-4' />
            Published
          </div>
        )}
      </div>

      <Modal isOpen={showPublishConfirm} onClose={() => setShowPublishConfirm(false)}>
        <h3 className='text-lg font-semibold mb-2'>Publish Configuration?</h3>
        <p className='text-sm text-muted-foreground mb-6'>
          This action will create a new version and make the configuration available to downstream
          modules.
        </p>
        <div className='flex items-center justify-end gap-3'>
          <Button variant='outline' onClick={() => setShowPublishConfirm(false)}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={publishMutation.isPending}>
            {publishMutation.isPending ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
