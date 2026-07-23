'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useCreateConfig, useUpdateConfig } from '@/services/exam-configs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form } from '@/components/ui/form';
import { CustomFormField } from '@/components/ui/custom-form-field';
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
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
      form.reset({
        name: initialData.name,
        code: initialData.code || '',
        role: initialData.role,
        durationMinutes: initialData.durationMinutes,
        totalQuestions: initialData.totalQuestions,
      });
    }
  }, [initialData, form]);

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 max-w-2xl' noValidate>
        <CustomFormField
          control={form.control}
          name="name"
          label="Config Name"
          render={(field) => (
            <Input
              {...field}
              placeholder='e.g. Software Engineer Screening'
              disabled={isSubmitting}
            />
          )}
        />

        <CustomFormField
          control={form.control}
          name="code"
          label="Config Code"
          render={(field) => (
            <Input
              {...field}
              placeholder='e.g. SWE_SCREENING'
              onChange={(e) => {
                field.onChange(e.target.value.toUpperCase());
              }}
              disabled={isSubmitting}
            />
          )}
        />

        <CustomFormField
          control={form.control}
          name="role"
          label="Role"
          render={(field) => (
            <Input
              {...field}
              placeholder='e.g. Software Engineer'
              disabled={isSubmitting}
            />
          )}
        />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <CustomFormField
            control={form.control}
            name="durationMinutes"
            label="Duration (minutes)"
            render={(field) => (
              <Input
                {...field}
                value={field.value ?? ''}
                type='number'
                placeholder='60'
                onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={isSubmitting}
              />
            )}
          />

          <CustomFormField
            control={form.control}
            name="totalQuestions"
            label="Total Questions"
            render={(field) => (
              <Input
                {...field}
                value={field.value ?? ''}
                type='number'
                placeholder='30'
                onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        <div className='pt-4 flex items-center justify-end'>
          <Button type='submit' isLoading={isSubmitting} disabled={isSubmitting}>
            {isEditMode ? 'Save Changes' : 'Create Configuration'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
