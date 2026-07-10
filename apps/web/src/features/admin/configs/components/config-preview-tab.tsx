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
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!config) {
    return <div>Configuration data not available.</div>;
  }

  const isReady = previewData?.isReadyToPublish;

  return (
    <div className='max-w-4xl mx-auto space-y-8 py-4 pb-16'>
      <div className='space-y-1'>
        <h3 className='text-2xl font-semibold tracking-tight'>Configuration Preview</h3>
        <p className='text-muted-foreground'>
          Review the structure and rule sets before initiating the assembly process.
        </p>
      </div>

      <div className='space-y-6'>
        {/* Core Identity */}
        <div className='border rounded-xl bg-card shadow-sm overflow-hidden'>
          <div className='bg-muted/30 px-6 py-4 border-b'>
            <h4 className='font-semibold text-foreground'>Configuration Identity</h4>
          </div>
          <div className='p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm'>
            <div className='space-y-1'>
              <p className='text-muted-foreground font-medium'>Config Name</p>
              <p className='font-semibold text-base'>{config.name}</p>
            </div>
            <div className='space-y-1'>
              <p className='text-muted-foreground font-medium'>Role</p>
              <p className='font-semibold text-base'>{config.role}</p>
            </div>
            <div className='space-y-1'>
              <p className='text-muted-foreground font-medium'>Blueprint</p>
              <p className='font-semibold text-base'>
                {selectedBlueprintId ? 'QA Automation (Linked)' : 'Generated Dynamically'}
              </p>
            </div>
            <div className='space-y-1'>
              <p className='text-muted-foreground font-medium'>Status</p>
              <p className={`font-semibold text-base ${isReady ? 'text-green-600' : 'text-amber-600'}`}>
                {isReady ? 'Ready to Assemble' : 'Incomplete'}
              </p>
            </div>
          </div>
        </div>

        {/* Structure & Assets */}
        <div className='border rounded-xl bg-card shadow-sm overflow-hidden'>
          <div className='bg-muted/30 px-6 py-4 border-b'>
            <h4 className='font-semibold text-foreground'>Structure & Assets</h4>
          </div>
          <div className='p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm'>
            <div className='space-y-1'>
              <p className='text-muted-foreground font-medium'>Topics</p>
              <p className='font-semibold text-lg'>{previewData?.totalTopics || 0} <span className="text-sm font-normal text-muted-foreground">Available</span></p>
            </div>
            <div className='space-y-1'>
              <p className='text-muted-foreground font-medium'>Concepts</p>
              <p className='font-semibold text-lg'>{previewData?.conceptCodes?.length || 0} <span className="text-sm font-normal text-muted-foreground">Mapped</span></p>
            </div>
            <div className='space-y-1'>
              <p className='text-muted-foreground font-medium'>Templates</p>
              <p className='font-semibold text-lg'>{previewData?.totalTemplates || 0} <span className="text-sm font-normal text-muted-foreground">Linked</span></p>
            </div>
            <div className='space-y-1'>
              <p className='text-muted-foreground font-medium'>Sections</p>
              <p className='font-semibold text-lg'>{sections?.length || 0} <span className="text-sm font-normal text-muted-foreground">Configured</span></p>
            </div>
          </div>
        </div>

        {/* Runtime Estimates & Rule Flags Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Runtime Estimates */}
          <div className='border rounded-xl bg-card shadow-sm overflow-hidden flex flex-col'>
            <div className='bg-muted/30 px-6 py-4 border-b'>
              <h4 className='font-semibold text-foreground'>Runtime Estimates</h4>
            </div>
            <div className='p-6 flex-1 flex flex-col justify-center space-y-6'>
              <div className='flex justify-between items-center'>
                <p className='text-muted-foreground font-medium'>Total Questions</p>
                <p className='font-semibold text-lg bg-primary/10 text-primary px-3 py-1 rounded-md'>{config.totalQuestions}</p>
              </div>
              <div className='flex justify-between items-center'>
                <p className='text-muted-foreground font-medium'>Total Duration</p>
                <p className='font-semibold text-lg bg-primary/10 text-primary px-3 py-1 rounded-md'>{config.durationMinutes} min</p>
              </div>
            </div>
          </div>

          {/* Rule Flags Summary */}
          <div className='border rounded-xl bg-card shadow-sm overflow-hidden flex flex-col'>
            <div className='bg-muted/30 px-6 py-4 border-b'>
              <h4 className='font-semibold text-foreground'>Rule Flags</h4>
            </div>
            <div className='p-6 grid grid-cols-2 gap-y-4 gap-x-2'>
              {[
                { key: 'negativeMarkingEnabled', label: 'Negative Marking' },
                { key: 'sectionalCutoffEnabled', label: 'Sectional Cutoff' },
                { key: 'adaptiveDifficultyEnabled', label: 'Adaptive Difficulty' },
                { key: 'shuffleQuestionsEnabled', label: 'Shuffle Questions' },
                { key: 'shuffleOptionsEnabled', label: 'Shuffle Options' },
                { key: 'allowSectionNavigation', label: 'Section Navigation' },
              ].map(({ key, label }) => {
                const isEnabled = (rules as any)?.[key];
                return (
                  <div key={key} className='flex items-center space-x-2'>
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${isEnabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-300'}`}
                    />
                    <span className={`text-sm ${isEnabled ? 'font-medium' : 'text-muted-foreground'}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
