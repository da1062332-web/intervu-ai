'use client';

import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SessionExpired() {
  const router = useRouter();

  return (
    <div className='min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center'>
      <div className='max-w-md space-y-6'>
        <div className='flex justify-center'>
          <div className='w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center'>
            <Clock className='w-8 h-8' />
          </div>
        </div>
        <div className='space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>Session Expired</h2>
          <p className='text-muted-foreground'>
            Your assessment session has expired. This typically happens if the timer runs out or if you leave the test window open for too long. Your answers have been automatically submitted.
          </p>
        </div>
        <div className='flex gap-4 justify-center pt-4'>
          <Button onClick={() => router.push('/candidate/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
