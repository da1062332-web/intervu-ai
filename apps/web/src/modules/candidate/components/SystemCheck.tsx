'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, CheckCircle2, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

interface SystemCheckProps {
  onStatusChange: (isReady: boolean) => void;
}

interface CheckItem {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'checking' | 'success' | 'failed';
  errorDetails?: string;
}

export function SystemCheck({ onStatusChange }: SystemCheckProps) {
  const [checks, setChecks] = useState<CheckItem[]>([
    {
      id: 'internet',
      name: 'Internet Connectivity',
      description: 'Checking for active network connectivity',
      status: 'pending',
    },
    {
      id: 'browser',
      name: 'Browser Compatibility',
      description: 'Verifying compliant browser engines',
      status: 'pending',
    },
    {
      id: 'screen',
      name: 'Screen Resolution',
      description: 'Validating viewport width (min 1024px)',
      status: 'pending',
    },
    {
      id: 'media',
      name: 'Camera & Microphone',
      description: 'Testing media hardware capabilities',
      status: 'pending',
    },
  ]);

  const [triggerCount, setTriggerCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function runChecks() {
      // 1. Internet Check
      updateCheckStatus('internet', 'checking');
      await sleep(400);
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (active) {
        updateCheckStatus(
          'internet',
          isOnline ? 'success' : 'failed',
          isOnline ? undefined : 'No internet connection detected.',
        );
      }

      // 2. Browser Check
      updateCheckStatus('browser', 'checking');
      await sleep(300);
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
      const isCompatible =
        userAgent.includes('chrome') ||
        userAgent.includes('firefox') ||
        userAgent.includes('safari') ||
        userAgent.includes('edge') ||
        userAgent.includes('applewebkit');
      if (active) {
        updateCheckStatus(
          'browser',
          isCompatible ? 'success' : 'failed',
          isCompatible
            ? undefined
            : 'Unsupported browser engine. Please use Chrome, Firefox, or Safari.',
        );
      }

      // 3. Screen Resolution Check
      updateCheckStatus('screen', 'checking');
      await sleep(300);
      const width = typeof window !== 'undefined' ? window.innerWidth : 1366;
      const height = typeof window !== 'undefined' ? window.innerHeight : 768;
      const isWidthValid = width >= 1024;
      if (active) {
        updateCheckStatus(
          'screen',
          isWidthValid ? 'success' : 'failed',
          isWidthValid
            ? undefined
            : `Viewport width (${width}px) is below minimum required 1024px.`,
        );
      }

      // 4. Media Hardware Permissions Check
      updateCheckStatus('media', 'checking');
      try {
        if (
          typeof navigator !== 'undefined' &&
          navigator.mediaDevices &&
          navigator.mediaDevices.getUserMedia
        ) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          // Immediately release media stream tracks
          stream.getTracks().forEach((track) => track.stop());
          if (active) {
            updateCheckStatus('media', 'success');
          }
        } else {
          throw new Error('Media capture APIs not supported in this environment.');
        }
      } catch (err) {
        if (active) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          updateCheckStatus(
            'media',
            'failed',
            `Permissions denied or hardware missing: ${errorMsg}`,
          );
        }
      }
    }

    runChecks();

    return () => {
      active = false;
    };
  }, [triggerCount]);

  // Sync readiness to parent
  useEffect(() => {
    const allSuccessful = checks.every((c) => c.status === 'success');
    onStatusChange(allSuccessful);
  }, [checks, onStatusChange]);

  function updateCheckStatus(id: string, status: CheckItem['status'], errorDetails?: string) {
    setChecks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status, errorDetails } : item)),
    );
  }

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function handleRetry() {
    setChecks((prev) =>
      prev.map((item) => ({ ...item, status: 'pending', errorDetails: undefined })),
    );
    setTriggerCount((c) => c + 1);
  }

  return (
    <Card className='glass-card border border-border/60 shadow-sm'>
      <CardHeader className='pb-3 flex flex-row items-center justify-between gap-4'>
        <div>
          <CardTitle className='text-lg font-bold flex items-center gap-2 text-foreground'>
            <ShieldCheck className='size-5 text-indigo-500' />
            System Readiness Check
          </CardTitle>
          <CardDescription>Verify your setup complies with testing regulations</CardDescription>
        </div>
        <Button
          variant='outline'
          size='icon'
          className='size-8 rounded-xl shrink-0'
          onClick={handleRetry}
          aria-label='Retry system check'
        >
          <RefreshCw className='size-4 text-muted-foreground' />
        </Button>
      </CardHeader>
      <CardContent className='space-y-4'>
        {checks.map((check) => (
          <div
            key={check.id}
            className='flex items-start justify-between p-3.5 rounded-xl border border-border/20 bg-card/45 hover:bg-muted/10 transition-colors gap-4'
          >
            <div className='space-y-1 min-w-0'>
              <h4 className='text-sm font-semibold text-foreground leading-none'>{check.name}</h4>
              <p className='text-xs text-muted-foreground leading-normal'>{check.description}</p>
              {check.status === 'failed' && check.errorDetails && (
                <p className='text-xs text-destructive font-medium mt-1 bg-destructive/5 px-2.5 py-1.5 rounded-md border border-destructive/10'>
                  {check.errorDetails}
                </p>
              )}
            </div>

            <div className='shrink-0 mt-0.5'>
              {check.status === 'pending' && (
                <div className='size-5 rounded-full border border-dashed border-border/80 bg-muted/40' />
              )}
              {check.status === 'checking' && (
                <Loader2 className='size-5 text-primary animate-spin' />
              )}
              {check.status === 'success' && (
                <CheckCircle2 className='size-5 text-green-500 fill-green-500/10' />
              )}
              {check.status === 'failed' && (
                <AlertTriangle className='size-5 text-destructive fill-destructive/10 animate-bounce' />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
