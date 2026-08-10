'use client';

import { useTabMonitor } from '../hooks/useTabMonitor';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export function TabWarningModal() {
  const { showWarning, dismissWarning, tabHiddenCount } = useTabMonitor();

  if (!showWarning) return null;

  return (
    <div className='fixed inset-0 z-[99999] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200'>
      <div className='max-w-md w-full bg-destructive/10 shadow-2xl rounded-2xl p-8 border border-destructive/20 flex flex-col items-center text-center space-y-6'>
        <div className='w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center'>
          <ShieldAlert className='size-8 text-destructive' />
        </div>

        <div className='space-y-3'>
          <h2 className='text-2xl font-bold tracking-tight text-destructive'>
            Warning: Tab Switched
          </h2>
          <p className='text-foreground font-medium'>
            You have navigated away from the assessment window. This violates the examination rules.
          </p>
          <p className='text-sm text-muted-foreground'>
            Violations recorded:{' '}
            <span className='font-bold text-destructive'>{tabHiddenCount}</span>
            <br />
            Further violations may result in the automatic termination of your assessment.
          </p>
        </div>

        <Button
          variant='destructive'
          size='lg'
          className='w-full text-base py-6 rounded-xl'
          onClick={dismissWarning}
        >
          I understand, return to assessment
        </Button>
      </div>
    </div>
  );
}
