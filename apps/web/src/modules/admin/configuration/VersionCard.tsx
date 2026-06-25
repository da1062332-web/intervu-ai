'use client';

import React from 'react';
import type { ConfigVersionEntry } from '@/services/exam-configs/types';
import { formatDistanceToNow, format } from 'date-fns';
import { Clock, RotateCcw, ChevronDown, ChevronRight, GitCommit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VersionCardProps {
  version: ConfigVersionEntry;
  isLatest?: boolean;
  onRestore?: (versionId: string) => void;
  isRestoring?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

/**
 * Task Group 8 — VersionCard
 * Displays a single version entry with restore action and expandable snapshot preview.
 */
export function VersionCard({
  version,
  isLatest = false,
  onRestore,
  isRestoring = false,
  isExpanded = false,
  onToggleExpand,
}: VersionCardProps) {
  const snapshot = version.snapshot as Record<string, unknown>;
  const examConfig = snapshot?.examConfig as Record<string, unknown> | undefined;
  const sections = (snapshot?.sections as unknown[]) ?? [];
  const difficulty = snapshot?.difficultyDistribution as Record<string, unknown> | null;

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-all',
        isLatest ? 'border-indigo-200 dark:border-indigo-800 shadow-sm' : 'border-border',
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3',
          isLatest ? 'bg-indigo-50/50 dark:bg-indigo-950/10' : 'bg-muted/30',
        )}
      >
        <div className='flex items-center gap-3'>
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              isLatest ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-muted',
            )}
          >
            <GitCommit
              className={cn(
                'w-4 h-4',
                isLatest ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground',
              )}
            />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <span className='font-semibold text-sm'>v{version.versionNumber}</span>
              {isLatest && (
                <span className='text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium'>
                  Latest
                </span>
              )}
            </div>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5'>
              <Clock className='w-3 h-3' />
              <span title={format(new Date(version.createdAt), 'PPpp')}>
                {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {onRestore && !isLatest && (
            <Button
              variant='outline'
              size='sm'
              className='h-7 text-xs gap-1'
              onClick={() => onRestore(version.id)}
              disabled={isRestoring}
            >
              <RotateCcw className='w-3 h-3' />
              {isRestoring ? 'Restoring...' : 'Restore'}
            </Button>
          )}
          {onToggleExpand && (
            <Button
              variant='ghost'
              size='sm'
              className='h-7 w-7 p-0'
              onClick={onToggleExpand}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className='w-4 h-4' />
              ) : (
                <ChevronRight className='w-4 h-4' />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Snapshot Preview (expandable) */}
      {isExpanded && (
        <div className='p-4 border-t space-y-4 bg-background text-sm'>
          {examConfig && (
            <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
              <div>
                <span className='text-muted-foreground text-xs'>Name</span>
                <p className='font-medium truncate'>{String(examConfig.name ?? '—')}</p>
              </div>
              <div>
                <span className='text-muted-foreground text-xs'>Role</span>
                <p className='font-medium'>{String(examConfig.role ?? '—')}</p>
              </div>
              <div>
                <span className='text-muted-foreground text-xs'>Duration</span>
                <p className='font-medium'>{String(examConfig.durationMinutes ?? '—')} min</p>
              </div>
              <div>
                <span className='text-muted-foreground text-xs'>Questions</span>
                <p className='font-medium'>{String(examConfig.totalQuestions ?? '—')}</p>
              </div>
            </div>
          )}

          {sections.length > 0 && (
            <div>
              <span className='text-muted-foreground text-xs'>Sections ({sections.length})</span>
              <div className='mt-1.5 space-y-1'>
                {(sections as Array<Record<string, unknown>>).map((s, i) => (
                  <div
                    key={i}
                    className='flex justify-between text-xs bg-muted/30 rounded px-2 py-1'
                  >
                    <span>{String(s.name ?? 'Section')}</span>
                    <span className='text-muted-foreground'>{String(s.questionCount ?? 0)} Q</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {difficulty && (
            <div>
              <span className='text-muted-foreground text-xs'>Difficulty</span>
              <div className='flex gap-3 mt-1.5 text-xs'>
                <span className='px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'>
                  Easy {String(difficulty.easyPercentage)}%
                </span>
                <span className='px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'>
                  Med {String(difficulty.mediumPercentage)}%
                </span>
                <span className='px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'>
                  Hard {String(difficulty.hardPercentage)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
