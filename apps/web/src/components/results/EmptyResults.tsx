import React from 'react';
import { ClipboardList } from 'lucide-react';

export function EmptyResults() {
  return (
    <div className='flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-background/50 h-64'>
      <div className='rounded-full bg-muted p-4 mb-4'>
        <ClipboardList className='h-8 w-8 text-muted-foreground' aria-hidden='true' />
      </div>
      <h2 className='text-xl font-semibold tracking-tight text-foreground mb-2'>
        No evaluation results yet.
      </h2>
      <p className='text-sm text-muted-foreground max-w-sm mx-auto'>
        Results will appear once evaluation is completed.
      </p>
    </div>
  );
}
