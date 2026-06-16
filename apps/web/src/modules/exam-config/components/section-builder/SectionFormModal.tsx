import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ExamSection, CreateSectionPayload } from '@/services/exam-sections/types';

const sectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  questionCount: z.number().min(1, 'Must be greater than 0'),
  durationMinutes: z.number().min(1, 'Must be greater than 0'),
  displayOrder: z.number().min(1, 'Must be at least 1'),
});

type SectionFormValues = z.infer<typeof sectionSchema>;

interface SectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSectionPayload) => void;
  initialData?: ExamSection | null;
  isLoading: boolean;
}

export function SectionFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: SectionFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: '',
      questionCount: 10,
      durationMinutes: 20,
      displayOrder: 1,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        questionCount: initialData.questionCount,
        durationMinutes: initialData.durationMinutes,
        displayOrder: initialData.displayOrder,
      });
    } else {
      reset({
        name: '',
        questionCount: 10,
        durationMinutes: 20,
        displayOrder: 1,
      });
    }
  }, [initialData, isOpen, reset]);

  const handleFormSubmit = (data: SectionFormValues) => {
    onSubmit(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={isLoading ? () => {} : onClose}>
      <div className='flex flex-col space-y-4'>
        <div>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
            {initialData ? 'Edit Section' : 'Add Section'}
          </h2>
        </div>

        <form id='section-form' onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Section Name</Label>
            <Input id='name' {...register('name')} placeholder='e.g. Quantitative Aptitude' />
            {errors.name && <p className='text-xs text-red-500'>{errors.name.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='questionCount'>Question Count</Label>
            <Input
              id='questionCount'
              type='number'
              {...register('questionCount', { valueAsNumber: true })}
            />
            {errors.questionCount && (
              <p className='text-xs text-red-500'>{errors.questionCount.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='durationMinutes'>Duration (Minutes)</Label>
            <Input
              id='durationMinutes'
              type='number'
              {...register('durationMinutes', { valueAsNumber: true })}
            />
            {errors.durationMinutes && (
              <p className='text-xs text-red-500'>{errors.durationMinutes.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='displayOrder'>Display Order</Label>
            <Input
              id='displayOrder'
              type='number'
              {...register('displayOrder', { valueAsNumber: true })}
            />
            {errors.displayOrder && (
              <p className='text-xs text-red-500'>{errors.displayOrder.message}</p>
            )}
          </div>
        </form>

        <div className='flex items-center justify-end space-x-2 pt-4'>
          <Button variant='outline' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type='submit' form='section-form' disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
