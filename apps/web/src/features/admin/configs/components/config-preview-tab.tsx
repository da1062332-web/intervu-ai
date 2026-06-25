'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfig } from '@/services/exam-configs';
import { usePublishConfig, useValidateConfig } from '@/services/exam-configs';
import { useSections } from '@/services/exam-sections';
import { useRuleFlags } from '@/features/admin/configs/hooks/use-rule-flags';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Upload, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ConfigPreviewTabProps {
  configId: string;
}

export function ConfigPreviewTab({ configId }: ConfigPreviewTabProps) {
  const router = useRouter();
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  // Fetch all necessary data
  const { data: config, isLoading: isLoadingConfig } = useConfig(configId);
  const { data: sections, isLoading: isLoadingSections } = useSections(configId);
  const { data: rules, isLoading: isLoadingRules } = useRuleFlags(configId);
  const validateMutation = useValidateConfig(configId);
  const publishMutation = usePublishConfig(configId);

  const isLoading = isLoadingConfig || isLoadingSections || isLoadingRules;
  const isPublished = config?.status === 'PUBLISHED' || config?.status === 'ACTIVE';

  const handleValidate = async () => {
    try {
      const result = await validateMutation.mutateAsync();
      setValidationResult(result);
    } catch {
      // toast is shown by the hook
    }
  };

  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync();
      router.push('/admin/configurations');
    } catch {
      // toast is shown by the hook
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-6 max-w-3xl'>
        <Skeleton className='h-32 w-full' />
        <Skeleton className='h-32 w-full' />
        <Skeleton className='h-32 w-full' />
      </div>
    );
  }

  if (!config) {
    return <div>Configuration data not available.</div>;
  }

  return (
    <div className='space-y-8 max-w-4xl pb-16'>
      <div>
        <h3 className='text-lg font-medium'>Review &amp; Publish</h3>
        <p className='text-sm text-muted-foreground'>
          Review your examination configuration before making it active.
        </p>
      </div>

      <div className='space-y-6'>
        {/* General Summary */}
        <div className='border rounded-lg overflow-hidden'>
          <div className='bg-muted/50 px-4 py-3 border-b'>
            <h4 className='font-medium'>General Settings</h4>
          </div>
          <div className='p-4 grid grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Config Name</p>
              <p className='font-medium'>{config.name}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Role</p>
              <p className='font-medium'>{config.role}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Duration</p>
              <p className='font-medium'>{config.durationMinutes} minutes</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Total Questions</p>
              <p className='font-medium'>{config.totalQuestions}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Status</p>
              <p className='font-medium'>{config.status ?? 'DRAFT'}</p>
            </div>
          </div>
        </div>

        {/* Sections Summary */}
        <div className='border rounded-lg overflow-hidden'>
          <div className='bg-muted/50 px-4 py-3 border-b'>
            <h4 className='font-medium'>Sections ({sections?.length || 0})</h4>
          </div>
          <div className='p-4'>
            {!sections || sections.length === 0 ? (
              <p className='text-sm text-muted-foreground'>No sections configured.</p>
            ) : (
              <ul className='space-y-3'>
                {sections.map((sec: any) => (
                  <li
                    key={sec.id}
                    className='flex justify-between items-center bg-muted/20 p-3 rounded-md border'
                  >
                    <span className='font-medium'>{sec.name}</span>
                    <span className='text-sm text-muted-foreground'>
                      {sec.questionCount} questions
                      {sec.sectionDurationMinutes ? ` • ${sec.sectionDurationMinutes} mins` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Rule Flags Summary */}
        <div className='border rounded-lg overflow-hidden'>
          <div className='bg-muted/50 px-4 py-3 border-b'>
            <h4 className='font-medium'>Rule Flags</h4>
          </div>
          <div className='p-4 grid grid-cols-2 gap-y-3'>
            {[
              { key: 'negativeMarkingEnabled', label: 'Negative Marking' },
              { key: 'sectionalCutoffEnabled', label: 'Sectional Cutoff' },
              { key: 'adaptiveDifficultyEnabled', label: 'Adaptive Difficulty' },
              { key: 'shuffleQuestionsEnabled', label: 'Shuffle Questions' },
              { key: 'shuffleOptionsEnabled', label: 'Shuffle Options' },
              { key: 'allowSectionNavigation', label: 'Allow Section Navigation' },
            ].map(({ key, label }) => (
              <div key={key} className='flex items-center space-x-2'>
                <span
                  className={`w-2 h-2 rounded-full ${(rules as any)?.[key] ? 'bg-green-500' : 'bg-gray-300'}`}
                />
                <span className='text-sm'>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Result */}
      {validationResult && (
        <div
          className={`rounded-lg border p-4 ${
            validationResult.valid
              ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/10'
              : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/10'
          }`}
        >
          <div className='flex items-center gap-2 mb-2'>
            {validationResult.valid ? (
              <ShieldCheck className='w-4 h-4 text-green-600 dark:text-green-400' />
            ) : (
              <AlertTriangle className='w-4 h-4 text-red-500' />
            )}
            <span
              className={`text-sm font-semibold ${
                validationResult.valid ? 'text-green-700 dark:text-green-400' : 'text-red-600'
              }`}
            >
              {validationResult.valid
                ? 'All checks passed — ready to publish'
                : `Validation failed — ${validationResult.errors.length} error(s)`}
            </span>
          </div>
          {validationResult.errors.map((err, i) => (
            <p key={i} className='text-xs text-red-600 dark:text-red-400 ml-6'>
              • {err}
            </p>
          ))}
          {validationResult.warnings.map((w, i) => (
            <p key={i} className='text-xs text-amber-600 dark:text-amber-400 ml-6'>
              ⚠ {w}
            </p>
          ))}
        </div>
      )}

      <div className='flex items-center gap-3 pt-4 border-t mt-8'>
        {!isPublished && (
          <Button
            variant='outline'
            onClick={handleValidate}
            disabled={validateMutation.isPending}
            className='gap-2'
          >
            {validateMutation.isPending ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <CheckCircle2 className='h-4 w-4' />
            )}
            {validateMutation.isPending ? 'Validating...' : 'Validate First'}
          </Button>
        )}

        <Button
          onClick={handlePublish}
          disabled={publishMutation.isPending || isPublished || config.isArchived}
          size='lg'
          className='gap-2'
        >
          {publishMutation.isPending ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Upload className='h-4 w-4' />
          )}
          {isPublished
            ? 'Already Published'
            : publishMutation.isPending
              ? 'Publishing...'
              : 'Save & Publish Configuration'}
        </Button>
      </div>
    </div>
  );
}
