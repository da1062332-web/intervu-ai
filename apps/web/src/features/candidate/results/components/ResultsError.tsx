import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResultsErrorProps {
  error: string;
}

export function ResultsError({ error }: ResultsErrorProps) {
  return (
    <div className='min-h-[60vh] flex flex-col items-center justify-center p-4 text-center'>
      <div className='w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6'>
        <AlertCircle className='w-8 h-8' />
      </div>
      <h2 className='text-2xl font-bold tracking-tight mb-2'>Unable To Load Results</h2>
      <p className='text-muted-foreground mb-8 max-w-md'>{error}</p>
      <Button onClick={() => window.location.reload()} variant='outline' className='min-w-[140px]'>
        <RefreshCcw className='w-4 h-4 mr-2' />
        Retry
      </Button>
    </div>
  );
}
