'use client';

import React, { useState } from 'react';
import type { ExamPublishedVersion } from '@/services/exam-configs/types';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Clock,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Hash,
  Layers,
  HelpCircle,
  Copy,
  Check,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PublishedVersionCardProps {
  version: ExamPublishedVersion;
  isLatest?: boolean;
}

export function PublishedVersionCard({ version, isLatest = false }: PublishedVersionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const sections = version.versionSections || [];
  const questionCount =
    version._count?.versionQuestions ??
    (version.configSnapshot?.sections?.reduce(
      (acc: number, s: any) => acc + (s.questionCount || 0),
      0,
    ) || 0);

  const attemptCount = version._count?.testInstances ?? 0;

  const handleCopyHash = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(version.versionHash);
      setCopiedHash(true);
      toast.success('SHA-256 version hash copied to clipboard');
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const isActive = version.status === 'ACTIVE';
  const isSuperseded = version.status === 'SUPERSEDED';

  return (
    <div
      className={cn(
        'border rounded-xl overflow-hidden transition-all bg-card shadow-2xs',
        isActive
          ? 'border-emerald-500/40 dark:border-emerald-500/30'
          : 'border-border/60',
      )}
    >
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer gap-3 select-none transition-colors hover:bg-muted/40',
          isActive ? 'bg-emerald-500/5' : 'bg-muted/20',
        )}
      >
        <div className='flex items-start sm:items-center gap-3.5'>
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 sm:mt-0 font-bold',
              isActive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : 'bg-muted text-muted-foreground border-border/60',
            )}
          >
            <ShieldCheck className='size-5' />
          </div>

          <div>
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='font-bold text-base text-foreground'>
                {version.versionName || `Version ${version.versionNumber}`}
              </span>
              <Badge
                variant={isActive ? 'default' : isSuperseded ? 'secondary' : 'outline'}
                className={cn(
                  'text-[10px] uppercase font-bold tracking-wider rounded-md px-2 py-0.5',
                  isActive
                    ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                    : isSuperseded
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300'
                      : '',
                )}
              >
                {version.status}
              </Badge>
              {isLatest && (
                <Badge variant='outline' className='text-[10px] font-semibold text-primary border-primary/30'>
                  Latest Release
                </Badge>
              )}
            </div>

            <div className='flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap font-medium'>
              <span className='flex items-center gap-1'>
                <Clock className='size-3.5 text-muted-foreground/70' />
                <span title={format(new Date(version.publishedAt), 'PPpp')}>
                  Published {formatDistanceToNow(new Date(version.publishedAt), { addSuffix: true })}
                </span>
              </span>

              {version.publishedBy && (
                <span className='flex items-center gap-1 border-l border-border/50 pl-3'>
                  <User className='size-3.5 text-muted-foreground/70' />
                  <span>By: {version.publishedBy}</span>
                </span>
              )}

              <button
                type='button'
                onClick={handleCopyHash}
                className='flex items-center gap-1 text-[11px] font-mono text-muted-foreground/80 hover:text-foreground transition-colors border-l border-border/50 pl-3'
                title={`SHA-256: ${version.versionHash}`}
              >
                <Hash className='size-3' />
                <span>{version.versionHash.slice(0, 8)}...</span>
                {copiedHash ? <Check className='size-3 text-emerald-600' /> : <Copy className='size-3' />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Stats & Expand Toggle */}
        <div className='flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40'>
          <div className='flex items-center gap-3 text-xs text-muted-foreground font-semibold'>
            <span className='flex items-center gap-1' title='Frozen Sections'>
              <Layers className='size-3.5 text-indigo-500' />
              <span>{sections.length > 0 ? sections.length : version.configSnapshot?.sections?.length || 0} Sections</span>
            </span>
            <span className='flex items-center gap-1' title='Frozen Questions'>
              <HelpCircle className='size-3.5 text-emerald-500' />
              <span>{questionCount} Questions</span>
            </span>
            {attemptCount > 0 && (
              <span className='px-2 py-0.5 rounded-md bg-muted text-[11px] font-mono'>
                {attemptCount} Attempts
              </span>
            )}
          </div>

          <Button
            variant='ghost'
            size='icon'
            className='size-8 rounded-lg text-muted-foreground'
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDown className='size-4' /> : <ChevronRight className='size-4' />}
          </Button>
        </div>
      </div>

      {/* Expandable Section Snapshot Preview */}
      {isExpanded && (
        <div className='p-5 border-t border-border/50 bg-background space-y-4 text-sm'>
          {version.changelogSummary && (
            <div className='p-3 rounded-lg bg-muted/40 border border-border/50'>
              <span className='text-xs font-bold text-foreground block mb-1 uppercase tracking-wider'>
                Changelog Summary
              </span>
              <p className='text-xs text-muted-foreground'>{version.changelogSummary}</p>
            </div>
          )}

          {/* Frozen Sections Breakdown */}
          <div>
            <h5 className='text-xs font-bold text-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5'>
              <Layers className='size-3.5 text-indigo-500' /> Frozen Sections
            </h5>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5'>
              {sections.map((sec) => (
                <div
                  key={sec.id || sec.sectionCode}
                  className='p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col justify-between'
                >
                  <div className='font-semibold text-xs text-foreground truncate'>
                    {sec.sectionName}
                  </div>
                  <div className='flex items-center justify-between text-[11px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/30'>
                    <span>{sec.sectionDurationMinutes} mins</span>
                    <span className='font-mono font-bold'>{sec.questionCount} Questions</span>
                  </div>
                </div>
              ))}
              {sections.length === 0 && (
                <p className='text-xs text-muted-foreground col-span-full'>
                  Section snapshot metadata recorded in config snapshot.
                </p>
              )}
            </div>
          </div>

          {/* Scoring Rules Snapshot */}
          {version.scoringRulesSnapshot && Object.keys(version.scoringRulesSnapshot).length > 0 && (
            <div className='pt-2 border-t border-border/40'>
              <h5 className='text-xs font-bold text-foreground mb-2 uppercase tracking-wider'>
                Frozen Scoring Rules
              </h5>
              <div className='flex flex-wrap gap-2 text-xs'>
                {Object.entries(version.scoringRulesSnapshot).map(([key, value]) => (
                  <span
                    key={key}
                    className='px-2.5 py-1 rounded-md bg-muted/50 border border-border/40 font-mono text-[11px]'
                  >
                    {key}: <strong>{String(value)}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
