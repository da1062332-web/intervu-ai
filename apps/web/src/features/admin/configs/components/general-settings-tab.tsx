'use client';

import React, { useState } from 'react';
import { useConfig } from '@/services/exam-configs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { ConfigForm } from '@/components/admin/config/config-form';
import { Edit2, X } from 'lucide-react';

interface GeneralSettingsTabProps {
  configId: string;
  onNext?: () => void;
}

export function GeneralSettingsTab({ configId, onNext }: GeneralSettingsTabProps) {
  const { data: config, isLoading } = useConfig(configId);
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-48'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className='max-w-4xl mx-auto space-y-8 py-4'>
      <div className='space-y-2'>
        <h3 className='text-2xl font-semibold tracking-tight'>General Settings</h3>
        <p className='text-muted-foreground'>Basic details for this examination configuration.</p>
      </div>

      <div className='p-8 border rounded-xl bg-card shadow-sm'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8'>
          <div className='space-y-1.5'>
            <p className='text-sm font-medium text-muted-foreground'>Config Name</p>
            <p className='text-lg font-semibold'>{config.name}</p>
          </div>

          <div className='space-y-1.5'>
            <p className='text-sm font-medium text-muted-foreground'>Config Code</p>
            <p className='text-lg font-semibold'>{config.code || 'N/A'}</p>
          </div>

          <div className='space-y-1.5'>
            <p className='text-sm font-medium text-muted-foreground'>Role</p>
            <p className='text-lg font-semibold'>{config.role}</p>
          </div>

          <div className='space-y-1.5'>
            <p className='text-sm font-medium text-muted-foreground'>Status</p>
            <p className='text-lg font-semibold'>
              {config.status === 'ARCHIVED'
                ? 'Archived'
                : config.status === 'VALIDATED'
                  ? 'Validated'
                  : config.status === 'PUBLISHED'
                    ? 'Published'
                    : config.isActive
                      ? 'Active'
                      : 'Draft'}
            </p>
          </div>

          <div className='space-y-1.5'>
            <p className='text-sm font-medium text-muted-foreground'>Duration</p>
            <p className='text-lg font-semibold'>{config.durationMinutes} minutes</p>
          </div>

          <div className='space-y-1.5'>
            <p className='text-sm font-medium text-muted-foreground'>Total Questions</p>
            <p className='text-lg font-semibold'>{config.totalQuestions} questions</p>
          </div>
        </div>
      </div>

      <div className='flex items-center justify-end gap-3 p-4 rounded-lg bg-muted/30'>
        <Button
          variant='outline'
          onClick={() => setIsEditing(true)}
          disabled={config.status === 'ARCHIVED'}
        >
          <Edit2 className='w-4 h-4 mr-2' />
          Edit Configuration
        </Button>
        {onNext && (
          <Button onClick={onNext} size='lg' className='shadow-sm'>
            Continue to Blueprint
          </Button>
        )}
      </div>

      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} className='max-w-xl'>
        <div className='flex items-center justify-between pb-4 border-b'>
          <h4 className='text-lg font-semibold'>Edit General Settings</h4>
          <Button variant='ghost' size='icon' onClick={() => setIsEditing(false)}>
            <X className='w-4 h-4' />
          </Button>
        </div>
        <div className='pt-4'>
          <ConfigForm initialData={config} onSuccess={() => setIsEditing(false)} />
        </div>
      </Modal>
    </div>
  );
}
