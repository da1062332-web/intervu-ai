'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize, AlertTriangle } from 'lucide-react';
import { useExecutionStore } from '../stores/execution.store';

export function FullscreenOverlay() {
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const checkFullscreen = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      useExecutionStore.getState().setInteractionBlocked(!isFs);
    };

    // Check initial state
    checkFullscreen();

    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('mozfullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);
    document.addEventListener('msfullscreenchange', checkFullscreen);

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('mozfullscreenchange', checkFullscreen);
      document.removeEventListener('webkitfullscreenchange', checkFullscreen);
      document.removeEventListener('msfullscreenchange', checkFullscreen);
    };
  }, []);

  const requestFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error('Error attempting to enable fullscreen:', err);
    }
  };

  if (!isMounted || isFullscreen) {
    return null;
  }

  return (
    <div
      className='fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200'
      style={{ pointerEvents: 'auto' }}
    >
      <div className='max-w-md w-full bg-card shadow-2xl rounded-2xl p-8 border border-border flex flex-col items-center text-center space-y-6'>
        <div className='w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center'>
          <AlertTriangle className='size-8 text-amber-500' />
        </div>

        <div className='space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>Fullscreen Required</h2>
          <p className='text-muted-foreground'>
            This assessment must be completed in fullscreen mode. Exiting fullscreen may result in
            automatic submission or flagging of your assessment.
          </p>
        </div>

        <Button size='lg' className='w-full text-base py-6 rounded-xl' onClick={requestFullscreen}>
          <Maximize className='mr-2 size-5' />
          Return to Fullscreen
        </Button>
      </div>
    </div>
  );
}
