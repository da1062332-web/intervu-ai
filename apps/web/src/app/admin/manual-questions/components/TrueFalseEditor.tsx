import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';

interface TrueFalseEditorProps {
  index: number;
  disabled?: boolean;
}

export function TrueFalseEditor({ index, disabled }: TrueFalseEditorProps) {
  const { register, watch, setValue } = useFormContext();

  const answer = watch(`questions.${index}.answer`);

  // Ensure options are always set to True/False for this type
  useEffect(() => {
    setValue(`questions.${index}.options`, ['True', 'False']);
  }, [index, setValue]);

  const handleSelect = (val: string) => {
    setValue(`questions.${index}.answer`, val, { shouldValidate: true });
  };

  return (
    <div className='space-y-4 p-4 border rounded-lg bg-gray-50/30 dark:bg-gray-900/30'>
      <div className='mb-2'>
        <Label className='text-sm font-semibold'>True / False Answer</Label>
        <p className='text-xs text-muted-foreground mt-1'>
          Select whether the correct answer is True or False.
        </p>
      </div>

      <div className='flex items-center space-x-6'>
        <label
          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
            answer === 'True'
              ? 'border-emerald-500 bg-emerald-50/20'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <input
            type='radio'
            name={`tf-${index}`}
            value='True'
            checked={answer === 'True'}
            onChange={() => handleSelect('True')}
            className='w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500'
            disabled={disabled}
          />
          <span className='font-medium'>True</span>
        </label>

        <label
          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
            answer === 'False'
              ? 'border-emerald-500 bg-emerald-50/20'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <input
            type='radio'
            name={`tf-${index}`}
            value='False'
            checked={answer === 'False'}
            onChange={() => handleSelect('False')}
            className='w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500'
            disabled={disabled}
          />
          <span className='font-medium'>False</span>
        </label>
      </div>

      <input type='hidden' {...register(`questions.${index}.answer`)} />
    </div>
  );
}
