'use client';

import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AssessmentUnavailable() {
  const router = useRouter();

  return (
    <div className='min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center'>
      <div className='max-w-md space-y-6'>
        <div className='flex justify-center'>
          <div className='w-16 h-16 bg-muted text-muted-foreground rounded-full flex items-center justify-center'>
            <ShieldAlert className='w-8 h-8' />
          </div>
        </div>
        <div className='space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>Assessment Unavailable</h2>
          <p className='text-muted-foreground'>
            We could not locate this assessment or you do not have permission to access it. It may have been withdrawn by the organization.
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
