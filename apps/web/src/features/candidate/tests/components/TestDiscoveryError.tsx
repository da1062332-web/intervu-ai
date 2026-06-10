'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TestDiscoveryErrorProps {
  error?: Error;
  reset?: () => void;
  message?: string;
}

export function TestDiscoveryError({
  error,
  reset,
  message = 'Unable To Load Assessment',
}: TestDiscoveryErrorProps) {
  const router = useRouter();

  const handleRetry = () => {
    if (reset) {
      reset();
    } else {
      router.refresh();
    }
  };

  return (
    <div className='flex items-center justify-center p-8 min-h-[50vh]'>
      <Card className='max-w-md w-full border-destructive/20'>
        <CardHeader className='text-center'>
          <div className='mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4'>
            <AlertTriangle className='size-8 text-destructive' />
          </div>
          <CardTitle className='text-2xl'>{message}</CardTitle>
          <CardDescription>
            {error?.message ||
              'There was a problem retrieving the assessment details. Please check your connection or try again.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='flex justify-center gap-4'>
          <Button variant='outline' onClick={() => router.back()}>
            Go Back
          </Button>
          <Button onClick={handleRetry} className='bg-primary text-primary-foreground'>
            <RotateCcw className='mr-2 size-4' />
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
