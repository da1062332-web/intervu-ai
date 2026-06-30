'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AssessmentErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Assessment Player Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center'>
          <div className='max-w-md space-y-6'>
            <div className='flex justify-center'>
              <div className='w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center'>
                <AlertTriangle className='w-8 h-8' />
              </div>
            </div>
            <div className='space-y-2'>
              <h2 className='text-2xl font-bold tracking-tight'>Something went wrong</h2>
              <p className='text-muted-foreground'>
                The assessment player encountered an unexpected error. Your progress has been
                automatically saved up to the last moment.
              </p>
            </div>
            <div className='flex gap-4 justify-center pt-4'>
              <Button onClick={() => window.location.reload()}>
                <RotateCcw className='mr-2 size-4' />
                Reload Assessment
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
