import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface CandidateDashboardErrorProps {
  error: string;
  onRetry: () => void;
}

export function CandidateDashboardError({ error, onRetry }: CandidateDashboardErrorProps) {
  return (
    <div className='flex items-center justify-center min-h-[50vh]'>
      <Card className='max-w-md w-full border-destructive/20'>
        <CardContent className='pt-6 flex flex-col items-center text-center space-y-4'>
          <div className='bg-destructive/10 p-4 rounded-full'>
            <AlertCircle className='size-8 text-destructive' />
          </div>
          <div className='space-y-2'>
            <h3 className='text-xl font-bold tracking-tight'>Failed to load dashboard</h3>
            <p className='text-sm text-muted-foreground'>{error}</p>
          </div>
          <Button onClick={onRetry} variant='outline' className='mt-4 group'>
            <RefreshCcw className='mr-2 size-4 group-hover:rotate-180 transition-transform duration-500' />
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
