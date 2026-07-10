import React from 'react';
import { Button } from '@/components/ui/button';

export interface PublishToolbarProps {
  selectedCount: number;
  onPublish: () => void;
  isProcessing?: boolean;
}

export function PublishToolbar({ selectedCount, onPublish, isProcessing }: PublishToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className='flex items-center justify-between bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-md border border-green-200 dark:border-green-800 mb-4 transition-all'>
      <span className='text-sm font-medium text-green-700 dark:text-green-300'>
        {selectedCount} approved question{selectedCount !== 1 && 's'} selected
      </span>
      <div className='flex items-center gap-2'>
        <Button
          variant='default'
          size='sm'
          className='bg-green-600 hover:bg-green-700 text-white'
          onClick={onPublish}
          disabled={isProcessing}
        >
          Publish Selected
        </Button>
      </div>
    </div>
  );
}
