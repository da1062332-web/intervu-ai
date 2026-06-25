'use client';

import React from 'react';
import type { ConfigVersionEntry } from '@/services/exam-configs/types';
import { formatDistanceToNow } from 'date-fns';
import { Clock, GitCommit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VersionTimelineProps {
  versions: ConfigVersionEntry[];
  selectedId?: string;
  onSelect: (version: ConfigVersionEntry) => void;
}

/**
 * Task Group 8 — VersionTimeline
 * Renders a vertical timeline of all version entries.
 */
export function VersionTimeline({ versions, selectedId, onSelect }: VersionTimelineProps) {
  if (versions.length === 0) {
    return (
      <div className='text-center py-12 text-muted-foreground'>
        <GitCommit className='w-10 h-10 mx-auto mb-3 opacity-30' />
        <p className='text-sm'>No version history yet.</p>
        <p className='text-xs mt-1'>Versions are created automatically when you publish.</p>
      </div>
    );
  }

  return (
    <div className='relative'>
      {/* Vertical line */}
      <div className='absolute left-4 top-0 bottom-0 w-px bg-border' />

      <div className='space-y-0'>
        {versions.map((version, idx) => {
          const isFirst = idx === 0;
          const isSelected = version.id === selectedId;

          return (
            <div key={version.id} className='relative pl-12 pr-2 py-1'>
              {/* Dot */}
              <div
                className={cn(
                  'absolute left-2 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                  isFirst
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-muted-foreground/40 bg-background',
                  isSelected && !isFirst && 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30',
                )}
              >
                {isFirst && <div className='w-2 h-2 rounded-full bg-white' />}
              </div>

              {/* Card */}
              <button
                onClick={() => onSelect(version)}
                className={cn(
                  'w-full text-left rounded-lg border p-3 transition-all hover:shadow-sm',
                  isSelected
                    ? 'border-indigo-300 bg-indigo-50/50 dark:border-indigo-700 dark:bg-indigo-950/10'
                    : 'border-transparent hover:border-border hover:bg-muted/30',
                )}
              >
                <div className='flex items-center justify-between'>
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      isFirst ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground',
                    )}
                  >
                    v{version.versionNumber}
                    {isFirst && (
                      <span className='ml-2 text-xs px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-normal'>
                        Latest
                      </span>
                    )}
                  </span>
                  <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                    <Clock className='w-3 h-3' />
                    {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
