import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import Editor from '@monaco-editor/react';

interface CodingEditorProps {
  index: number;
  disabled?: boolean;
}

export function CodingEditor({ index, disabled }: CodingEditorProps) {
  const { register, watch, setValue } = useFormContext();

  const codingData = watch(`questions.${index}.codingData`) || {};

  const handleChange = (field: string, value: string | undefined) => {
    setValue(
      `questions.${index}.codingData`,
      { ...codingData, [field]: value },
      { shouldValidate: true },
    );
  };

  return (
    <div className='space-y-4 p-4 border rounded-lg bg-gray-50/30 dark:bg-gray-900/30'>
      <div className='mb-2'>
        <Label className='text-sm font-semibold'>Coding Challenge Details</Label>
        <p className='text-xs text-muted-foreground mt-1'>
          Configure problem statement, code snippets, and tests.
        </p>
      </div>

      <div className='space-y-2'>
        <Label>Problem Statement</Label>
        <textarea
          className='flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
          placeholder='Describe the coding problem here...'
          value={codingData.problemStatement || ''}
          onChange={(e) => handleChange('problemStatement', e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label>Constraints (Optional)</Label>
          <textarea
            className='flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
            placeholder='e.g. 1 <= N <= 10^5'
            value={codingData.constraints || ''}
            onChange={(e) => handleChange('constraints', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className='space-y-2'>
          <Label>Test Cases (Optional)</Label>
          <textarea
            className='flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
            placeholder='e.g. JSON array of tests or simple description'
            value={codingData.testCases || ''}
            onChange={(e) => handleChange('testCases', e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Hidden fields just in case react-hook-form needs it, though setValue should suffice */}
      <input type='hidden' {...register(`questions.${index}.codingData`)} />
    </div>
  );
}
