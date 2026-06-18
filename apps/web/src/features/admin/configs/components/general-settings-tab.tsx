'use client';

import React from 'react';
import { useConfig } from '@/services/exam-configs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit2 } from 'lucide-react';
import Link from 'next/link';

interface GeneralSettingsTabProps {
  configId: string;
  onNext?: () => void;
}

export function GeneralSettingsTab({ configId, onNext }: GeneralSettingsTabProps) {
  const { data: config, isLoading } = useConfig(configId);

  if (isLoading) {
    return (
      <div className='space-y-6 max-w-2xl'>
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-24 w-full' />
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className='space-y-6 max-w-3xl'>
      <div>
        <h3 className='text-lg font-medium'>General Settings</h3>
        <p className='text-sm text-muted-foreground'>
          Basic details for this examination configuration.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-6'>
        <div className='space-y-1'>
          <p className='text-sm font-medium text-muted-foreground'>Config Name</p>
          <p className='text-base font-semibold'>{config.name}</p>
        </div>

        <div className='space-y-1'>
          <p className='text-sm font-medium text-muted-foreground'>Config Code</p>
          <p className='text-base font-semibold'>{config.code || 'N/A'}</p>
        </div>

        <div className='space-y-1'>
          <p className='text-sm font-medium text-muted-foreground'>Role</p>
          <p className='text-base font-semibold'>{config.role}</p>
        </div>

        <div className='space-y-1'>
          <p className='text-sm font-medium text-muted-foreground'>Status</p>
          <p className='text-base font-semibold'>
            {config.status === 'ARCHIVED' ? 'Archived' : config.isActive ? 'Active' : 'Draft'}
          </p>
        </div>

        <div className='space-y-1'>
          <p className='text-sm font-medium text-muted-foreground'>Duration</p>
          <p className='text-base font-semibold'>{config.durationMinutes} minutes</p>
        </div>

        <div className='space-y-1'>
          <p className='text-sm font-medium text-muted-foreground'>Total Questions</p>
          <p className='text-base font-semibold'>{config.totalQuestions} questions</p>
        </div>
      </div>

      <div className='pt-6 flex justify-end gap-3'>
        <Button variant='outline' asChild disabled={config.status === 'ARCHIVED'}>
          <Link href={`/admin/configs/${configId}/edit`}>
            <Edit2 className='w-4 h-4 mr-2' />
            Edit Configuration
          </Link>
        </Button>
        {onNext && <Button onClick={onNext}>Continue to Sections</Button>}
      </div>
    </div>
  );
}
