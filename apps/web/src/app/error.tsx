'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service (telemetry integration point)
    console.error('Unhandled Global Error:', error);
  }, [error]);

  return (
    <div className='flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background px-4 text-center'>
      <div className='mx-auto max-w-md animate-fade-in-up space-y-6'>
        <div className='flex justify-center'>
          <div className='rounded-full bg-destructive/10 p-4'>
            <AlertTriangle className='size-12 text-destructive' />
          </div>
        </div>

        <div className='space-y-2'>
          <h1 className='font-heading text-3xl font-bold tracking-tight text-foreground'>
            Something went wrong
          </h1>
          <p className='text-sm text-muted-foreground leading-relaxed'>
            We apologize for the inconvenience. An unexpected error has occurred.
            Our team has been notified.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className='mt-4 rounded-lg bg-muted p-4 text-left text-xs font-mono text-muted-foreground overflow-auto max-h-48 border border-border'>
            {error.message}
          </div>
        )}

        <div className='flex flex-col sm:flex-row items-center justify-center gap-3 pt-4'>
          <Button
            onClick={reset}
            variant='default'
            className='w-full sm:w-auto h-11'
          >
            <RefreshCw className='mr-2 size-4' />
            Try again
          </Button>
          <Button
            asChild
            variant='outline'
            className='w-full sm:w-auto h-11'
          >
            <Link href='/'>
              <Home className='mr-2 size-4' />
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
