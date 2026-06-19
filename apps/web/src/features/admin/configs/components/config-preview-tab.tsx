'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useConfig, useUpdateConfig } from '@/services/exam-configs';
import { useSections } from '@/services/exam-sections';
import { useRuleFlags } from '@/features/admin/configs/hooks/use-rule-flags';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ConfigPreviewTabProps {
  configId: string;
}

export function ConfigPreviewTab({ configId }: ConfigPreviewTabProps) {
  const router = useRouter();

  // Fetch all necessary data
  const { data: config, isLoading: isLoadingConfig } = useConfig(configId);
  const { data: sections, isLoading: isLoadingSections } = useSections(configId);
  const { data: rules, isLoading: isLoadingRules } = useRuleFlags(configId);
  const { mutate: updateConfig, isPending: isPublishing } = useUpdateConfig(configId);

  const isLoading = isLoadingConfig || isLoadingSections || isLoadingRules;

  const handlePublish = () => {
    // Attempt to mark as active, then redirect
    updateConfig(
      { isActive: true },
      {
        onSuccess: () => {
          router.push('/admin/configs');
        },
      },
    );
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
        <h3 className='text-lg font-medium'>Review & Publish</h3>
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
                      {sec.durationMinutes ? ` • ${sec.durationMinutes} mins` : ''}
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
            <div className='flex items-center space-x-2'>
              <span
                className={`w-2 h-2 rounded-full ${rules?.negativeMarkingEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              <span className='text-sm'>Negative Marking</span>
            </div>
            <div className='flex items-center space-x-2'>
              <span
                className={`w-2 h-2 rounded-full ${rules?.sectionalCutoffEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              <span className='text-sm'>Sectional Cutoff</span>
            </div>
            <div className='flex items-center space-x-2'>
              <span
                className={`w-2 h-2 rounded-full ${rules?.adaptiveDifficultyEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              <span className='text-sm'>Adaptive Difficulty</span>
            </div>
            <div className='flex items-center space-x-2'>
              <span
                className={`w-2 h-2 rounded-full ${rules?.shuffleQuestionsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              <span className='text-sm'>Shuffle Questions</span>
            </div>
            <div className='flex items-center space-x-2'>
              <span
                className={`w-2 h-2 rounded-full ${rules?.shuffleOptionsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              <span className='text-sm'>Shuffle Options</span>
            </div>
            <div className='flex items-center space-x-2'>
              <span
                className={`w-2 h-2 rounded-full ${rules?.allowSectionNavigation ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              <span className='text-sm'>Allow Section Navigation</span>
            </div>
          </div>
        </div>
      </div>

      <div className='flex justify-end pt-4 border-t mt-8'>
        <Button onClick={handlePublish} disabled={isPublishing} size='lg'>
          {isPublishing ? 'Publishing...' : 'Save & Publish Configuration'}
        </Button>
      </div>
    </div>
  );
}
