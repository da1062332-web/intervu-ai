'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useConfig, useUpdateConfig } from '@/services/exam-configs';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Config Name is required')
    .max(150, 'Config Name must be less than 150 characters'),
  code: z
    .string()
    .min(1, 'Config Code is required')
    .max(100, 'Config Code must be less than 100 characters')
    .regex(
      /^[A-Z0-9_]+$/,
      'Code must be uppercase and only contain letters, numbers, and underscores',
    ),
  role: z.string().min(1, 'Role is required').max(100, 'Role must be less than 100 characters'),
  durationMinutes: z.coerce.number().positive('Duration must be a positive number'),
  totalQuestions: z.coerce.number().positive('Total Questions must be a positive number'),
});

type FormValues = z.infer<typeof formSchema>;

interface GeneralSettingsTabProps {
  configId: string;
  onNext?: () => void;
}

export function GeneralSettingsTab({ configId, onNext }: GeneralSettingsTabProps) {
  const { data: config, isLoading } = useConfig(configId);
  const { mutateAsync: updateConfig, isPending: isSubmitting } = useUpdateConfig(configId);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      role: '',
      durationMinutes: 0,
      totalQuestions: 0,
    },
  });

  useEffect(() => {
    if (config) {
      reset({
        name: config.name,
        code: config.code || '',
        role: config.role,
        durationMinutes: config.durationMinutes,
        totalQuestions: config.totalQuestions,
      });
    }
  }, [config, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      await updateConfig(data);
      if (onNext) onNext();
    } catch {
      // toast is already handled by useUpdateConfig onError
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-6 max-w-2xl'>
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-24 w-full' />
      </div>
    );
  }

  return (
    <div className='space-y-6 max-w-2xl'>
      <div>
        <h3 className='text-lg font-medium'>General Settings</h3>
        <p className='text-sm text-muted-foreground'>
          Update the basic details for this examination configuration.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6' noValidate>
        <div className='space-y-2'>
          <Label htmlFor='name'>Config Name</Label>
          <Input
            id='name'
            placeholder='e.g. Software Engineer Screening'
            {...register('name')}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p id='name-error' className='text-sm text-destructive' role='alert'>
              {errors.name.message}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='code'>Config Code</Label>
          <Input
            id='code'
            placeholder='e.g. SWE_SCREENING'
            {...register('code', {
              onChange: (e) => {
                setValue('code', e.target.value.toUpperCase(), {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              },
            })}
            aria-invalid={!!errors.code}
            aria-describedby={errors.code ? 'code-error' : undefined}
            disabled={isSubmitting}
          />
          {errors.code && (
            <p id='code-error' className='text-sm text-destructive' role='alert'>
              {errors.code.message}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='role'>Role</Label>
          <Input
            id='role'
            placeholder='e.g. Software Engineer'
            {...register('role')}
            aria-invalid={!!errors.role}
            aria-describedby={errors.role ? 'role-error' : undefined}
            disabled={isSubmitting}
          />
          {errors.role && (
            <p id='role-error' className='text-sm text-destructive' role='alert'>
              {errors.role.message}
            </p>
          )}
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
            <Label htmlFor='durationMinutes'>Duration (minutes)</Label>
            <Input
              id='durationMinutes'
              type='number'
              placeholder='60'
              {...register('durationMinutes')}
              aria-invalid={!!errors.durationMinutes}
              aria-describedby={errors.durationMinutes ? 'durationMinutes-error' : undefined}
              disabled={isSubmitting}
            />
            {errors.durationMinutes && (
              <p id='durationMinutes-error' className='text-sm text-destructive' role='alert'>
                {errors.durationMinutes.message}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='totalQuestions'>Total Questions</Label>
            <Input
              id='totalQuestions'
              type='number'
              placeholder='30'
              {...register('totalQuestions')}
              aria-invalid={!!errors.totalQuestions}
              aria-describedby={errors.totalQuestions ? 'totalQuestions-error' : undefined}
              disabled={isSubmitting}
            />
            {errors.totalQuestions && (
              <p id='totalQuestions-error' className='text-sm text-destructive' role='alert'>
                {errors.totalQuestions.message}
              </p>
            )}
          </div>
        </div>

        <div className='pt-4 flex items-center justify-end border-t'>
          <Button type='submit' disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
            {isDirty ? 'Save & Continue' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
}
