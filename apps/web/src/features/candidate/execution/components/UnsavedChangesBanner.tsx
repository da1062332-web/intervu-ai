'use client';

import { useExecutionStore } from '../stores/execution.store';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function UnsavedChangesBanner() {
  const { hasUnsavedChanges, autosaveStatus, connectionStatus } = useExecutionStore();

  const isSyncPending = 
    hasUnsavedChanges || 
    autosaveStatus === 'SAVING' || 
    autosaveStatus === 'FAILED' || 
    (hasUnsavedChanges && connectionStatus === 'OFFLINE');

  if (!isSyncPending) return null;

  let message = 'Sync Pending';
  if (connectionStatus === 'OFFLINE' && hasUnsavedChanges) {
    message = 'Offline (Unsaved)';
  } else if (autosaveStatus === 'FAILED') {
    message = 'Retrying Save...';
  } else if (autosaveStatus === 'SAVING') {
    message = 'Saving...';
  }

  return (
    <Badge 
      variant="outline" 
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-amber-500/10 text-amber-700 border-amber-500/20 shadow-sm"
    >
      <AlertCircle className={`w-3.5 h-3.5 ${autosaveStatus === 'SAVING' ? 'animate-pulse' : ''}`} />
      {message}
    </Badge>
  );
}
