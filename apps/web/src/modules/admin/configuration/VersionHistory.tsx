'use client';

import React, { useState } from 'react';
import {
  useConfigVersions,
  useRestoreVersion,
  useCreateVersion,
  usePublishedVersions,
} from '@/services/exam-configs';
import { VersionTimeline } from './VersionTimeline';
import { VersionCard } from './VersionCard';
import { VersionCompare } from './VersionCompare';
import { PublishedVersionCard } from './PublishedVersionCard';
import type { ConfigVersionEntry } from '@/services/exam-configs/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitBranch, GitCompare, Plus, ShieldCheck, History } from 'lucide-react';

interface VersionHistoryProps {
  configId: string;
}

type TabType = 'published' | 'snapshots';
type ViewMode = 'list' | 'compare';

export function VersionHistory({ configId }: VersionHistoryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('published');
  const { data: publishedVersions, isLoading: isLoadingPublished } = usePublishedVersions(configId);
  const { data: draftVersions, isLoading: isLoadingDrafts } = useConfigVersions(configId);

  const restoreMutation = useRestoreVersion(configId);
  const createVersionMutation = useCreateVersion(configId);

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [compareId, setCompareId] = useState<string | undefined>(undefined);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const draftList = draftVersions ?? [];
  const publishedList = publishedVersions ?? [];

  const selectedVersion = draftList.find((v) => v.id === selectedId);
  const compareVersion = draftList.find((v) => v.id === compareId);

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

  const isLoading = activeTab === 'published' ? isLoadingPublished : isLoadingDrafts;

  return (
    <div className='space-y-6'>
      {/* Tab Navigation */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-3'>
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val as TabType);
            setViewMode('list');
          }}
          className='w-full sm:w-auto'
        >
          <TabsList className='bg-muted/60 p-1 rounded-xl'>
            <TabsTrigger value='published' className='gap-2 text-xs font-bold rounded-lg px-3.5 py-1.5'>
              <ShieldCheck className='size-3.5 text-emerald-600' />
              <span>Published Releases</span>
              {publishedList.length > 0 && (
                <span className='ml-1 px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-mono'>
                  {publishedList.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value='snapshots' className='gap-2 text-xs font-bold rounded-lg px-3.5 py-1.5'>
              <History className='size-3.5 text-indigo-500' />
              <span>Draft Snapshots</span>
              {draftList.length > 0 && (
                <span className='ml-1 px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-mono'>
                  {draftList.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'snapshots' && (
          <div className='flex items-center gap-2 self-end sm:self-auto'>
            {draftList.length >= 2 && (
              <Button
                variant={viewMode === 'compare' ? 'default' : 'outline'}
                size='sm'
                className='gap-1.5 h-8 text-xs font-semibold rounded-lg'
                onClick={() => setViewMode(viewMode === 'compare' ? 'list' : 'compare')}
              >
                <GitCompare className='size-3.5' />
                {viewMode === 'compare' ? 'Back to List' : 'Compare Versions'}
              </Button>
            )}
            <Button
              variant='outline'
              size='sm'
              className='gap-1.5 h-8 text-xs font-semibold rounded-lg'
              onClick={() => createVersionMutation.mutate()}
              disabled={createVersionMutation.isPending}
            >
              <Plus className='size-3.5' />
              {createVersionMutation.isPending ? 'Saving...' : 'Save Snapshot'}
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className='space-y-3 pt-2'>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className='h-20 w-full rounded-xl border border-border/50' />
          ))}
        </div>
      ) : activeTab === 'published' ? (
        /* Published Releases View */
        <div className='space-y-4'>
          {publishedList.length === 0 ? (
            <div className='text-center py-16 border border-dashed border-border/80 rounded-2xl bg-card p-8'>
              <ShieldCheck className='size-10 text-muted-foreground/50 mx-auto mb-3' />
              <h4 className='font-bold text-foreground text-base'>No Published Versions Yet</h4>
              <p className='text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed'>
                This assessment has not been published yet. Once published, immutable version records (V1, V2, etc.) and frozen question snapshots will appear here.
              </p>
            </div>
          ) : (
            <div className='space-y-3.5'>
              {publishedList.map((version, idx) => (
                <PublishedVersionCard
                  key={version.id}
                  version={version}
                  isLatest={idx === 0}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Draft Snapshots / Compare View */
        <div>
          {viewMode === 'compare' && selectedVersion && compareVersion ? (
            <VersionCompare versionA={compareVersion} versionB={selectedVersion} />
          ) : viewMode === 'compare' ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3'>
                  Select "From" version
                </p>
                <div className='space-y-2'>
                  {draftList.map((v) => (
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
                  {draftList.map((v) => (
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
            </div>
          ) : (
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <div className='lg:col-span-1'>
                <VersionTimeline
                  versions={draftList}
                  selectedId={selectedId}
                  onSelect={(v: ConfigVersionEntry) => setSelectedId(v.id)}
                />
              </div>

              <div className='lg:col-span-2 space-y-3'>
                {draftList.length === 0 ? (
                  <div className='text-center py-12 border rounded-xl text-muted-foreground bg-card'>
                    <p className='text-sm font-medium'>No draft snapshots yet.</p>
                    <p className='text-xs mt-1'>
                      Click "Save Snapshot" to create a manual draft recovery point.
                    </p>
                  </div>
                ) : (
                  draftList.map((version, idx) => (
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
      )}
    </div>
  );
}
