'use client';

import React from 'react';
import { useConfig } from '@/services/exam-configs';
import { useSections } from '@/services/exam-sections';
import { useRuleFlags } from '@/features/admin/configs/hooks/use-rule-flags';
import { useConfigWizardStore } from './wizard-store';
import { Skeleton } from '@/components/ui/skeleton';
import { useConfigPreview } from '@/services/exam-configs/hooks';

interface ConfigPreviewTabProps {
  configId: string;
}

export function ConfigPreviewTab({ configId }: ConfigPreviewTabProps) {
  const { data: config, isLoading: isLoadingConfig } = useConfig(configId);
  const { data: previewData, isLoading: isLoadingPreview } = useConfigPreview(configId);
  const { data: sections, isLoading: isLoadingSections } = useSections(configId);
  const { data: rules, isLoading: isLoadingRules } = useRuleFlags(configId);
  const selectedBlueprintId = useConfigWizardStore((state) => state.getBlueprintId(configId));

  const isLoading = isLoadingConfig || isLoadingSections || isLoadingRules || isLoadingPreview;

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

  const isReady = previewData?.isReadyToPublish;

  return (
    <div className='space-y-8 max-w-4xl pb-16'>
      <div>
        <h3 className='text-lg font-medium'>Preview Assembly</h3>
        <p className='text-sm text-muted-foreground'>
          Review exactly what will be generated before initiating the assembly process.
        </p>
      </div>

      <div className='space-y-6'>
        {/* Core Identity */}
        <div className='border rounded-lg overflow-hidden'>
          <div className='bg-muted/50 px-4 py-3 border-b'>
            <h4 className='font-medium'>Configuration Identity</h4>
          </div>
          <div className='p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
            <div>
              <p className='text-muted-foreground'>Config Name</p>
              <p className='font-medium'>{config.name}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Role</p>
              <p className='font-medium'>{config.role}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Blueprint</p>
              <p className='font-medium'>
                {selectedBlueprintId ? 'QA Automation (Linked)' : 'Generated Dynamically'}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground'>Status</p>
              <p className='font-medium'>{isReady ? 'Ready' : 'Incomplete'}</p>
            </div>
          </div>
        </div>

        {/* Structure & Assets */}
        <div className='border rounded-lg overflow-hidden'>
          <div className='bg-muted/50 px-4 py-3 border-b'>
            <h4 className='font-medium'>Structure & Assets</h4>
          </div>
          <div className='p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
            <div>
              <p className='text-muted-foreground'>Topics</p>
              <p className='font-medium'>{previewData?.totalTopics || 0} Available</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Concepts</p>
              <p className='font-medium'>{previewData?.conceptCodes?.length || 0} Mapped</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Templates</p>
              <p className='font-medium'>{previewData?.totalTemplates || 0} Linked</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Sections</p>
              <p className='font-medium'>{sections?.length || 0} Configured</p>
            </div>
          </div>
        </div>

        {/* Runtime Estimates */}
        <div className='border rounded-lg overflow-hidden'>
          <div className='bg-muted/50 px-4 py-3 border-b'>
            <h4 className='font-medium'>Runtime Estimates</h4>
          </div>
          <div className='p-4 grid grid-cols-2 gap-4 text-sm'>
            <div>
              <p className='text-muted-foreground'>Estimated Total Questions</p>
              <p className='font-medium'>{config.totalQuestions}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Estimated Total Duration</p>
              <p className='font-medium'>{config.durationMinutes} minutes</p>
            </div>
          </div>
        </div>

        {/* Rule Flags Summary */}
        <div className='border rounded-lg overflow-hidden'>
          <div className='bg-muted/50 px-4 py-3 border-b'>
            <h4 className='font-medium'>Rule Flags</h4>
          </div>
          <div className='p-4 grid grid-cols-2 md:grid-cols-3 gap-y-3 text-sm'>
            {[
              { key: 'negativeMarkingEnabled', label: 'Negative Marking' },
              { key: 'sectionalCutoffEnabled', label: 'Sectional Cutoff' },
              { key: 'adaptiveDifficultyEnabled', label: 'Adaptive Difficulty' },
              { key: 'shuffleQuestionsEnabled', label: 'Shuffle Questions' },
              { key: 'shuffleOptionsEnabled', label: 'Shuffle Options' },
              { key: 'allowSectionNavigation', label: 'Section Navigation' },
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
    </div>
  );
}
