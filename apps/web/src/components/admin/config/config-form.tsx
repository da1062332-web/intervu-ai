'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Config Name is required')
    .max(150, 'Config Name must be less than 150 characters'),
  role: z.string().min(1, 'Role is required').max(100, 'Role must be less than 100 characters'),
  durationMinutes: z.coerce.number().positive('Duration must be a positive number'),
  totalQuestions: z.coerce.number().positive('Total Questions must be a positive number'),
});

type FormValues = z.infer<typeof formSchema>;

export function ConfigForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      role: '',
      durationMinutes: undefined,
      totalQuestions: undefined,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Form Data:', data);
      toast.success('Configuration created successfully');
    } catch {
      toast.error('Failed to create configuration');
    } finally {
      setIsSubmitting(false);
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
          Create Configuration
        </Button>
      </div>
    </form>
  );
}
