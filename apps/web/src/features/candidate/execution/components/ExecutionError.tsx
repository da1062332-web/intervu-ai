'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ExecutionErrorProps {
  error: string;
}

export function ExecutionError({ error }: ExecutionErrorProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Unable To Load Assessment</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>

        <div className="flex gap-4 justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/candidate/dashboard')}
          >
            Return to Dashboard
          </Button>
          <Button 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}
