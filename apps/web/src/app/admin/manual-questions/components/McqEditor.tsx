import React from 'react';
import { useFormContext, useController } from 'react-hook-form';
import { Label } from '@/components/ui/label';

interface McqEditorProps {
  index: number;
  disabled?: boolean;
}

export function McqEditor({ index, disabled }: McqEditorProps) {
  const { register, watch, setValue } = useFormContext();

  const { field: optionsField } = useController({
    name: `questions.${index}.options`,
    defaultValue: ['', '', '', ''],
  });

  const options: string[] =
    Array.isArray(optionsField.value) && optionsField.value.length > 0
      ? optionsField.value
      : ['', '', '', ''];

  const correctIndexStr = watch(`questions.${index}.mcqCorrectIndex`);

  const handleOptionChange = (optIdx: number, val: string) => {
    const updated = [...options];
    while (updated.length < 4) updated.push('');
    updated[optIdx] = val;
    optionsField.onChange(updated);

    // If this option is currently marked as correct, update the `answer` field
    if (String(optIdx) === String(correctIndexStr)) {
      setValue(`questions.${index}.answer`, val, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleCorrectChange = (optIdx: number) => {
    setValue(`questions.${index}.mcqCorrectIndex`, String(optIdx), {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`questions.${index}.answer`, options[optIdx] || '', {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div className='space-y-4 p-4 border rounded-lg bg-gray-50/30 dark:bg-gray-900/30'>
      <div className='mb-2'>
        <Label className='text-sm font-semibold'>Multiple Choice Options</Label>
        <p className='text-xs text-muted-foreground mt-1'>
          Provide 4 options and select the correct one.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {[0, 1, 2, 3].map((optIdx) => {
          const isCorrect = String(optIdx) === String(correctIndexStr);
          return (
            <div
              key={optIdx}
              className={`flex flex-col space-y-2 p-3 border rounded-md transition-colors ${
                isCorrect
                  ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                  : 'border-input bg-background'
              }`}
            >
              <div className='flex items-center justify-between'>
                <Label
                  className={`text-sm font-medium ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : ''}`}
                >
                  Option {String.fromCharCode(65 + optIdx)}
                </Label>
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='radio'
                    name={`correct-${index}`}
                    className='w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500'
                    checked={isCorrect}
                    onChange={() => handleCorrectChange(optIdx)}
                    disabled={disabled}
                  />
                  <span className='text-xs font-medium text-muted-foreground'>Correct</span>
                </label>
              </div>
              <textarea
                className='flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                placeholder={`Enter option ${String.fromCharCode(65 + optIdx)}...`}
                value={options[optIdx] || ''}
                onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                disabled={disabled}
              />
            </div>
          );
        })}
      </div>

      <input type='hidden' {...register(`questions.${index}.mcqCorrectIndex`)} />
      <input type='hidden' {...register(`questions.${index}.answer`)} />
    </div>
  );
}
