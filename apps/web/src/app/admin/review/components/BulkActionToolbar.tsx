import React from 'react';
import { Button } from '@/components/ui/button';

export interface BulkActionToolbarProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

export function BulkActionToolbar({ selectedCount, onApprove, onReject, isProcessing }: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-md border border-blue-200 dark:border-blue-800 mb-4 transition-all">
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
        {selectedCount} question{selectedCount !== 1 && 's'} selected
      </span>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          onClick={onReject}
          disabled={isProcessing}
        >
          Reject Selected
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={onApprove}
          disabled={isProcessing}
        >
          Approve Selected
        </Button>
      </div>
    </div>
  );
}
