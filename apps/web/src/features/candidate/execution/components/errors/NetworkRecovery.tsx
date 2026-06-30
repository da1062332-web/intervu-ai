'use client';

import { Button } from '@/components/ui/button';
import { WifiOff, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

export function NetworkRecovery() {
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      window.location.reload();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const handleRetry = () => {
    setIsChecking(true);
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.reload();
      } else {
        setIsChecking(false);
      }
    }, 1000);
  };

  return (
    <div className='min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center'>
      <div className='max-w-md space-y-6'>
        <div className='flex justify-center'>
          <div className='w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center'>
            <WifiOff className='w-8 h-8' />
          </div>
        </div>
        <div className='space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>Connection Lost</h2>
          <p className='text-muted-foreground'>
            We have lost connection to the server. Do not close your browser. We will automatically
            reconnect you once your internet is restored, and your answers are safely stored
            locally.
          </p>
        </div>
        <div className='flex gap-4 justify-center pt-4'>
          <Button onClick={handleRetry} disabled={isChecking}>
            <RotateCcw className={`mr-2 size-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking connection...' : 'Try Reconnecting'}
          </Button>
        </div>
      </div>
    </div>
  );
}
