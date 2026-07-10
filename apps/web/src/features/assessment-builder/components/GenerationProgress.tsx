import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface GenerationProgressProps {
  isGenerating: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  progress?: number;
}

const steps = [
  'Initializing generation engine...',
  'Analyzing blueprint configuration...',
  'Selecting questions from pool...',
  'Generating AI questions...',
  'Validating difficulty distribution...',
  'Finalizing assessment...',
];

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  isGenerating,
  isError,
  isSuccess,
  progress = 0,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isGenerating && !isSuccess) {
      return;
    }

    if (isSuccess || progress === 100) {
      setCurrentStep(steps.length - 1);
      return;
    }

    // Map progress (0-100) to step index (0 to length - 1)
    const calculatedStep = Math.min(
      steps.length - 1,
      Math.max(0, Math.floor((progress / 100) * steps.length)),
    );
    setCurrentStep(calculatedStep);
  }, [isGenerating, isSuccess, progress]);

  if (!isGenerating && !isError && !isSuccess) {
    return null;
  }

  return (
    <Card
      className={`border-2 ${isSuccess ? 'border-green-500' : isError ? 'border-red-500' : 'border-primary'}`}
    >
      <CardContent className='p-6'>
        <div className='flex flex-col items-center justify-center space-y-6 text-center'>
          {isGenerating && (
            <div className='flex flex-col items-center'>
              <Loader2 className='h-12 w-12 text-primary animate-spin mb-4' />
              <h3 className='text-lg font-medium text-foreground'>Generating Assessment</h3>
              <p className='text-sm text-muted-foreground mt-2 min-h-[1.5rem]'>
                {steps[currentStep]}
              </p>
            </div>
          )}

          {isSuccess && (
            <div className='flex flex-col items-center text-green-600'>
              <CheckCircle2 className='h-12 w-12 mb-4' />
              <h3 className='text-lg font-medium'>Generation Complete!</h3>
              <p className='text-sm text-muted-foreground mt-2'>
                Your assessment is ready for review.
              </p>
            </div>
          )}

          {isError && (
            <div className='flex flex-col items-center text-red-600'>
              <AlertCircle className='h-12 w-12 mb-4' />
              <h3 className='text-lg font-medium'>Generation Failed</h3>
              <p className='text-sm text-muted-foreground mt-2'>
                {progress > 0
                  ? `Generation failed after reaching ${Math.round(progress)}%. Please try again.`
                  : 'An error occurred while generating the assessment. Please try again.'}
              </p>
            </div>
          )}

          <div className='w-full max-w-md mx-auto'>
            <Progress
              value={isError ? 100 : progress}
              className={`h-2 w-full ${isError ? 'bg-red-200' : ''}`}
              // we can't easily style the indicator inside Shadcn Progress from here without inline styles or specific variants
              // assuming default handles the green/red well enough or we rely on the container
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
