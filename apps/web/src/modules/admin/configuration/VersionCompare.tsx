'use client';

import React from 'react';
import type { ConfigVersionEntry } from '@/services/exam-configs/types';
import { ArrowRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface VersionCompareProps {
  versionA: ConfigVersionEntry;
  versionB: ConfigVersionEntry;
}

type SnapshotConfig = Record<string, unknown>;

/**
 * Task Group 8 — VersionCompare
 * Side-by-side diff of two version snapshots.
 * Works with mock or real version data.
 */
export function VersionCompare({ versionA, versionB }: VersionCompareProps) {
  const snapA = versionA.snapshot as SnapshotConfig;
  const snapB = versionB.snapshot as SnapshotConfig;
  const configA = (snapA?.examConfig ?? {}) as SnapshotConfig;
  const configB = (snapB?.examConfig ?? {}) as SnapshotConfig;
  const diffA = (snapA?.difficultyDistribution ?? {}) as SnapshotConfig;
  const diffB = (snapB?.difficultyDistribution ?? {}) as SnapshotConfig;
  const sectionsA = (snapA?.sections as SnapshotConfig[]) ?? [];
  const sectionsB = (snapB?.sections as SnapshotConfig[]) ?? [];

  const compareField = (label: string, a: unknown, b: unknown, unit = '') => {
    const changed = String(a) !== String(b);
    return (
      <TableRow key={label} className={changed ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}>
        <TableCell className='py-2 pr-3 text-xs text-muted-foreground font-medium whitespace-nowrap'>
          {label}
        </TableCell>
        <TableCell
          className={`py-2 pr-6 text-xs font-mono ${changed ? 'text-amber-700 dark:text-amber-400' : ''}`}
        >
          {String(a ?? '—')}
          {unit}
        </TableCell>
        <TableCell className='py-2 pr-3'>
          {changed && <ArrowRight className='w-3 h-3 text-muted-foreground' />}
        </TableCell>
        <TableCell
          className={`py-2 text-xs font-mono ${changed ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''}`}
        >
          {String(b ?? '—')}
          {unit}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='grid grid-cols-2 gap-4 text-sm'>
        <div className='p-3 rounded-lg bg-muted/40 border'>
          <p className='text-xs text-muted-foreground'>From</p>
          <p className='font-semibold'>v{versionA.versionNumber}</p>
        </div>
        <div className='p-3 rounded-lg bg-indigo-50/50 border border-indigo-200 dark:bg-indigo-950/10 dark:border-indigo-800'>
          <p className='text-xs text-muted-foreground'>To</p>
          <p className='font-semibold text-indigo-600 dark:text-indigo-400'>
            v{versionB.versionNumber}
          </p>
        </div>
      </div>

      {/* General Settings Diff */}
      <div>
        <h4 className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2'>
          General Settings
        </h4>
        <div className='border rounded-lg overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-28'>Field</TableHead>
                <TableHead>v{versionA.versionNumber}</TableHead>
                <TableHead className='w-6' />
                <TableHead>v{versionB.versionNumber}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compareField('Name', configA.name, configB.name)}
              {compareField('Role', configA.role, configB.role)}
              {compareField('Duration', configA.durationMinutes, configB.durationMinutes, ' min')}
              {compareField('Questions', configA.totalQuestions, configB.totalQuestions)}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Difficulty Diff */}
      <div>
        <h4 className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2'>
          Difficulty Distribution
        </h4>
        <div className='border rounded-lg overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-28'>Level</TableHead>
                <TableHead>v{versionA.versionNumber}</TableHead>
                <TableHead className='w-6' />
                <TableHead>v{versionB.versionNumber}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compareField('Easy', diffA.easyPercentage, diffB.easyPercentage, '%')}
              {compareField('Medium', diffA.mediumPercentage, diffB.mediumPercentage, '%')}
              {compareField('Hard', diffA.hardPercentage, diffB.hardPercentage, '%')}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Section Count Diff */}
      <div>
        <h4 className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2'>
          Sections
        </h4>
        <div className='grid grid-cols-2 gap-3 text-sm'>
          <div className='border rounded-lg p-3 space-y-1'>
            <p className='text-xs text-muted-foreground mb-2'>v{versionA.versionNumber}</p>
            {sectionsA.length === 0 ? (
              <p className='text-xs text-muted-foreground italic'>No sections</p>
            ) : (
              sectionsA.map((s, i) => (
                <div key={i} className='flex justify-between text-xs'>
                  <span>{String(s.name ?? 'Section')}</span>
                  <span className='text-muted-foreground'>{String(s.questionCount ?? 0)} Q</span>
                </div>
              ))
            )}
          </div>
          <div className='border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 space-y-1 bg-indigo-50/20 dark:bg-indigo-950/10'>
            <p className='text-xs text-muted-foreground mb-2'>v{versionB.versionNumber}</p>
            {sectionsB.length === 0 ? (
              <p className='text-xs text-muted-foreground italic'>No sections</p>
            ) : (
              sectionsB.map((s, i) => (
                <div key={i} className='flex justify-between text-xs'>
                  <span>{String(s.name ?? 'Section')}</span>
                  <span className='text-muted-foreground'>{String(s.questionCount ?? 0)} Q</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
