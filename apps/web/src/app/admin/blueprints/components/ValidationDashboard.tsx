'use client';

import { useValidateBlueprint } from '@/services/blueprints/hooks';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { ValidationResult } from '@/services/blueprints/types';
import { useState } from 'react';

interface ValidationDashboardProps {
  blueprintId: string;
  initialValidation?: ValidationResult;
}

export function ValidationDashboard({ blueprintId, initialValidation }: ValidationDashboardProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(
    initialValidation || null,
  );
  const validateMutation = useValidateBlueprint();

  const handleValidate = async () => {
    try {
      const res = await validateMutation.mutateAsync(blueprintId);
      setValidationResult(res);
    } catch (err) {
      // Error handled in mutation
    }
  };

  return (
    <div className='space-y-4 border rounded-md p-6 bg-white dark:bg-gray-900 shadow-sm'>
      <div className='flex items-center justify-between border-b pb-4'>
        <h3 className='text-lg font-semibold'>Validation Dashboard</h3>
        <Button onClick={handleValidate} disabled={validateMutation.isPending} variant='outline'>
          {validateMutation.isPending && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
          Run Validation
        </Button>
      </div>

      {!validationResult && !validateMutation.isPending && (
        <div className='text-center py-8 text-muted-foreground'>
          <p>Blueprint Not Yet Validated</p>
          <p className='text-sm mt-1'>
            Click &apos;Run Validation&apos; to verify blueprint integrity.
          </p>
        </div>
      )}

      {validateMutation.isPending && (
        <div className='flex items-center justify-center py-8'>
          <Loader2 className='w-6 h-6 animate-spin text-indigo-600' />
        </div>
      )}

      {validationResult && !validateMutation.isPending && (
        <div className='space-y-6 mt-4'>
          {validationResult.valid ? (
            <div className='flex items-center gap-3 p-4 bg-green-50 text-green-800 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400'>
              <CheckCircle2 className='w-6 h-6' />
              <div>
                <p className='font-semibold'>Validation Passed</p>
                <p className='text-sm mt-1'>
                  All structural, topical, and difficulty constraints are satisfied.
                </p>
              </div>
            </div>
          ) : (
            <div className='flex items-start gap-3 p-4 bg-red-50 text-red-800 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400'>
              <AlertCircle className='w-6 h-6 mt-0.5 flex-shrink-0' />
              <div className='w-full'>
                <p className='font-semibold'>Validation Failed</p>
                <p className='text-sm mt-1 mb-4'>
                  The blueprint contains structural errors that must be resolved before use.
                </p>

                <div className='space-y-3'>
                  <h4 className='font-medium text-sm text-gray-900 dark:text-gray-100'>
                    Error Breakdown
                  </h4>
                  <ul className='space-y-2'>
                    {validationResult.errors?.map((error, idx) => (
                      <li key={idx} className='text-sm flex gap-2'>
                        <span className='text-red-500'>✗</span>{' '}
                        {error.replace(/Section "[^"]+":\s*/g, '')}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t'>
            <div>
              <p className='text-xs text-muted-foreground'>Configured Questions</p>
              <p className='font-semibold'>{validationResult.totalConfiguredQuestions}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Expected Questions</p>
              <p className='font-semibold'>{validationResult.totalExpectedQuestions}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Missing Questions</p>
              <p
                className={`font-semibold ${validationResult.totalMissingQuestions > 0 ? 'text-red-500' : ''}`}
              >
                {validationResult.totalMissingQuestions}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Total Weightage</p>
              <p
                className={`font-semibold ${validationResult.totalWeightage !== 100 ? 'text-red-500' : 'text-green-600'}`}
              >
                {validationResult.totalWeightage}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
