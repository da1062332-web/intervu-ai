'use client';

import { useEffect } from 'react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useCreateConfig, useUpdateConfig } from '@/services/exam-configs';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExamConfig } from '@/services/exam-configs/types';

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

interface ConfigFormProps {
  initialData?: ExamConfig;
}

export function ConfigForm({ initialData }: ConfigFormProps) {
  const router = useRouter();
  const createMutation = useCreateConfig();
  const updateMutation = useUpdateConfig(initialData?.id || '');

  const isEditMode = !!initialData;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      code: initialData?.code || '',
      role: initialData?.role || '',
      durationMinutes: initialData?.durationMinutes || undefined,
      totalQuestions: initialData?.totalQuestions || undefined,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        code: initialData.code || '',
        role: initialData.role,
        durationMinutes: initialData.durationMinutes,
        totalQuestions: initialData.totalQuestions,
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync(data);
        router.push(`/admin/configurations/${initialData.id}`);
      } else {
        const response = await createMutation.mutateAsync(data);
        if (response && response.id) {
          router.push(`/admin/configurations/${response.id}`);
        } else {
          router.push('/admin/configurations');
        }
      }
    } catch {
      // toast is already handled by hooks
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 max-w-2xl' noValidate>
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

      <div className='pt-4 flex items-center justify-end'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
          {isEditMode ? 'Save Changes' : 'Create Configuration'}
        </Button>
      </div>
    </form>
  );
}
