'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useValidateStart } from '../hooks/useValidateStart';
import { ValidationResponse } from '../types/test.types';
import { PlayCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StartAssessmentButtonProps {
  testId: string;
  onValidationComplete: (response: ValidationResponse) => void;
}

export function StartAssessmentButton({
  testId,
  onValidationComplete,
}: StartAssessmentButtonProps) {
  const router = useRouter();
  const { mutateAsync: validateStart, isPending } = useValidateStart();

  const handleStart = async () => {
    try {
      const response = await validateStart(testId);
      onValidationComplete(response);

      if (response.isEligible) {
        router.push(`/candidate/tests/${testId}/execution`);
      } else {
        toast.error('You are not eligible to start this assessment.');
      }
    } catch {
      toast.error('Failed to validate assessment start.');
    }
  };

  return (
    <Button
      onClick={handleStart}
      disabled={isPending}
      className='w-full sm:w-auto h-12 px-8 text-base group'
    >
      {isPending ? (
        <Loader2 className='mr-2 size-5 animate-spin' />
      ) : (
        <PlayCircle className='mr-2 size-5 group-hover:scale-110 transition-transform' />
      )}
      {isPending ? 'Validating...' : 'Start Test'}
    </Button>
  );
}
