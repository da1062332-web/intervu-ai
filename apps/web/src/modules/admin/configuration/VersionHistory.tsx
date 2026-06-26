'use client';

import React, { useState } from 'react';
import { useConfigVersions, useRestoreVersion, useCreateVersion } from '@/services/exam-configs';
import { VersionTimeline } from './VersionTimeline';
import { VersionCard } from './VersionCard';
import { VersionCompare } from './VersionCompare';
import type { ConfigVersionEntry } from '@/services/exam-configs/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GitBranch, GitCompare, Plus } from 'lucide-react';

interface VersionHistoryProps {
  configId: string;
}

type ViewMode = 'list' | 'compare';

/**
 * Task Group 7/8 — VersionHistory
 * Full version history page with timeline, card details, and compare mode.
 */
export function VersionHistory({ configId }: VersionHistoryProps) {
  const { data: versions, isLoading } = useConfigVersions(configId);
  const restoreMutation = useRestoreVersion(configId);
  const createVersionMutation = useCreateVersion(configId);

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [compareId, setCompareId] = useState<string | undefined>(undefined);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const selectedVersion = versions?.find((v) => v.id === selectedId);
  const compareVersion = versions?.find((v) => v.id === compareId);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRestore = (versionId: string) => {
    if (
      window.confirm(
        'Restore to this version? The config status will be reset to DRAFT and must be re-validated.',
      )
    ) {
      restoreMutation.mutate(versionId);
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-3'>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className='h-16 w-full rounded-lg' />
        ))}
      </div>
    );
  }

  const versionList = versions ?? [];

  return (
    <div className='space-y-6'>
      {/* Toolbar */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <GitBranch className='w-4 h-4 text-muted-foreground' />
          <span className='text-sm font-medium'>
            {versionList.length} version{versionList.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          {versionList.length >= 2 && (
            <Button
              variant={viewMode === 'compare' ? 'default' : 'outline'}
              size='sm'
              className='gap-1.5 h-8 text-xs'
              onClick={() => setViewMode(viewMode === 'compare' ? 'list' : 'compare')}
            >
              <GitCompare className='w-3.5 h-3.5' />
              {viewMode === 'compare' ? 'Back to List' : 'Compare Versions'}
            </Button>
          )}
          <Button
            variant='outline'
            size='sm'
            className='gap-1.5 h-8 text-xs'
            onClick={() => createVersionMutation.mutate()}
            disabled={createVersionMutation.isPending}
          >
            <Plus className='w-3.5 h-3.5' />
            {createVersionMutation.isPending ? 'Saving...' : 'Save Snapshot'}
          </Button>
        </div>
      </div>

      {viewMode === 'compare' && selectedVersion && compareVersion ? (
        <VersionCompare versionA={compareVersion} versionB={selectedVersion} />
      ) : viewMode === 'compare' ? (
        /* Compare selection mode */
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3'>
              Select "From" version
            </p>
            <div className='space-y-2'>
              {versionList.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setCompareId(v.id)}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                    compareId === v.id
                      ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20'
                      : 'border-border hover:bg-muted/30'
                  }`}
                >
                  v{v.versionNumber}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3'>
              Select "To" version
            </p>
            <div className='space-y-2'>
              {versionList.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                    selectedId === v.id
                      ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/20'
                      : 'border-border hover:bg-muted/30'
                  }`}
                >
                  v{v.versionNumber}
                </button>
              ))}
            </div>
          </div>
          {compareId && selectedId && (
            <div className='md:col-span-2 flex justify-center'>
              <Button
                onClick={() => {
                  /* trigger compare render via state already set */
                }}
              >
                View Comparison
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* List mode */
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Timeline sidebar */}
          <div className='lg:col-span-1'>
            <VersionTimeline
              versions={versionList}
              selectedId={selectedId}
              onSelect={(v: ConfigVersionEntry) => setSelectedId(v.id)}
            />
          </div>

          {/* Cards main area */}
          <div className='lg:col-span-2 space-y-3'>
            {versionList.length === 0 ? (
              <div className='text-center py-12 border rounded-lg text-muted-foreground'>
                <p className='text-sm'>No versions yet.</p>
                <p className='text-xs mt-1'>
                  Click "Save Snapshot" or publish the config to create a version.
                </p>
              </div>
            ) : (
              versionList.map((version, idx) => (
                <VersionCard
                  key={version.id}
                  version={version}
                  isLatest={idx === 0}
                  onRestore={handleRestore}
                  isRestoring={
                    restoreMutation.isPending && restoreMutation.variables === version.id
                  }
                  isExpanded={expandedIds.has(version.id)}
                  onToggleExpand={() => toggleExpand(version.id)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
