'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin Error:', error);
  }, [error]);

  return (
    <div className='flex min-h-[50vh] flex-col items-center justify-center text-center px-4'>
      <div className='mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 space-y-6'>
        <div className='flex justify-center'>
          <div className='rounded-full bg-destructive/10 p-4'>
            <AlertTriangle className='size-10 text-destructive' />
          </div>
        </div>
        <div className='space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>Something went wrong</h1>
          <p className='text-sm text-muted-foreground'>
            An unexpected error occurred in the Admin Portal.
          </p>
        </div>
        <div className='flex flex-col sm:flex-row items-center justify-center gap-3 pt-4'>
          <Button onClick={reset} variant='default' className='w-full sm:w-auto'>
            <RefreshCw className='mr-2 size-4' />
            Try again
          </Button>
          <Button asChild variant='outline' className='w-full sm:w-auto'>
            <Link href='/admin/dashboard'>
              <Home className='mr-2 size-4' />
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
