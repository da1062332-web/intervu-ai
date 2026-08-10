import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useCreateConcept,
  useUpdateConcept,
  type ConceptMapping,
} from '@/services/concept-mapping';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Controller } from 'react-hook-form';

const formSchema = z.object({
  conceptName: z
    .string()
    .min(1, 'Concept Name is required')
    .max(100, 'Must be less than 100 characters'),
  conceptCode: z
    .string()
    .min(1, 'Concept Code is required')
    .max(100, 'Must be less than 100 characters')
    .regex(
      /^[A-Z0-9_]+$/,
      'Code must be uppercase and only contain letters, numbers, and underscores',
    ),
  description: z.string().optional(),
  questionSource: z.enum(['VARIABLE_TEMPLATE', 'MANUAL'], {
    required_error: 'Please select a question source.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface ConceptFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: string;
  concept?: ConceptMapping | null;
}

export function ConceptFormModal({ isOpen, onClose, topicId, concept }: ConceptFormModalProps) {
  const isEditing = !!concept;
  const { mutateAsync: createConcept, isPending: isCreating } = useCreateConcept(topicId);
  const { mutateAsync: updateConcept, isPending: isUpdating } = useUpdateConcept(topicId);
  const isSubmitting = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      conceptName: '',
      conceptCode: '',
      description: '',
      questionSource: 'VARIABLE_TEMPLATE',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (concept) {
        reset({
          conceptName: concept.name || concept.conceptName || '',
          conceptCode: concept.code || concept.conceptCode || '',
          description: concept.description || '',
          questionSource:
            (concept.questionSources?.[0] as 'VARIABLE_TEMPLATE' | 'MANUAL') || 'VARIABLE_TEMPLATE',
        });
      } else {
        reset({
          conceptName: '',
          conceptCode: '',
          description: '',
          questionSource: 'VARIABLE_TEMPLATE',
        });
      }
    }
  }, [isOpen, concept, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        name: data.conceptName,
        code: data.conceptCode,
        description: data.description,
        questionSources: [data.questionSource],
      };

      if (isEditing && concept) {
        await updateConcept({ conceptId: concept.id, payload });
      } else {
        await createConcept(payload);
      }
      onClose();
    } catch {
      // Errors are handled by react-query onError toast
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className='max-w-md'>
      <div className='space-y-6'>
        <div>
          <h3 className='text-lg font-medium'>{isEditing ? 'Edit Concept' : 'Add Concept'}</h3>
          <p className='text-sm text-muted-foreground'>
            {isEditing ? 'Update the concept details.' : 'Add a new concept mapping.'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4' noValidate>
          <div className='space-y-2'>
            <Label htmlFor='conceptName'>Concept Name</Label>
            <Input
              id='conceptName'
              placeholder='e.g. Array Traversal'
              {...register('conceptName')}
              aria-invalid={!!errors.conceptName}
              disabled={isSubmitting}
            />
            {errors.conceptName && (
              <p className='text-sm text-destructive' role='alert'>
                {errors.conceptName.message}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='conceptCode'>Concept Code</Label>
            <Input
              id='conceptCode'
              placeholder='e.g. ARRAY_TRAVERSAL'
              {...register('conceptCode', {
                onChange: (e) => {
                  setValue('conceptCode', e.target.value.toUpperCase(), {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                },
              })}
              aria-invalid={!!errors.conceptCode}
              disabled={isSubmitting || isEditing} // code might not be editable, but let's allow or disable? The prompt doesn't specify if it's immutable. We'll leave it editable unless required otherwise. But actually, let's keep it editable.
            />
            {errors.conceptCode && (
              <p className='text-sm text-destructive' role='alert'>
                {errors.conceptCode.message}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description (Optional)</Label>
            <textarea
              id='description'
              className='flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
              placeholder='Brief description of the concept'
              {...register('description')}
              disabled={isSubmitting}
            />
          </div>

          <div className='space-y-3'>
            <Label>Question Source</Label>
            <Controller
              control={control}
              name='questionSource'
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className='flex flex-col space-y-1'
                  disabled={isSubmitting}
                >
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='VARIABLE_TEMPLATE' id='r1' />
                    <Label htmlFor='r1' className='font-normal cursor-pointer'>
                      Variable Template
                    </Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='MANUAL' id='r2' />
                    <Label htmlFor='r2' className='font-normal cursor-pointer'>
                      Manual Questions
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.questionSource && (
              <p className='text-sm text-destructive' role='alert'>
                {errors.questionSource.message}
              </p>
            )}
          </div>

          <div className='pt-4 flex items-center justify-end space-x-2 border-t'>
            <Button type='button' variant='outline' onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting || (!isDirty && !isEditing)}>
              {isSubmitting && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
              {isEditing ? 'Save Changes' : 'Add Concept'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
