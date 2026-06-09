'use client';

import { useExecutionStore } from '../stores/execution.store';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function AutosaveIndicator() {
  const { autosaveStatus, lastSavedAt } = useExecutionStore();

  if (autosaveStatus === 'IDLE') return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {autosaveStatus === 'SAVING' && (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          <span>Saving...</span>
        </>
      )}
      {autosaveStatus === 'SAVED' && (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          <span className="hidden sm:inline">
            Saved {lastSavedAt ? lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
          <span className="sm:hidden">Saved</span>
        </>
      )}
      {autosaveStatus === 'FAILED' && (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          <span className="text-destructive">Unable to save</span>
        </>
      )}
    </div>
  );
}
