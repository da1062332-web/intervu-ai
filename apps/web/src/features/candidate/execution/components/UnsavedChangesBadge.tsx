'use client';

import { useExecutionStore } from '../stores/execution.store';

export function UnsavedChangesBadge() {
  const { hasUnsavedChanges, autosaveStatus } = useExecutionStore();

  if (!hasUnsavedChanges && autosaveStatus !== 'SAVING') return null;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-full bg-orange-100 text-orange-700 border border-orange-200">
      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
      Unsaved
    </div>
  );
}
