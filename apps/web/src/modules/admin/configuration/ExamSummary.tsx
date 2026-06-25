'use client';

import React from 'react';
import { FileText, Clock, Hash, Tag } from 'lucide-react';

interface ExamSummaryProps {
  name: string;
  role: string;
  durationMinutes: number;
  totalQuestions: number;
  status?: string;
  code?: string;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  VALIDATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PUBLISHED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  ARCHIVED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

/**
 * Task Group 9 — ExamSummary
 * High-level exam configuration summary card.
 */
export function ExamSummary({
  name,
  role,
  durationMinutes,
  totalQuestions,
  status,
  code,
}: ExamSummaryProps) {
  const statusStyle = status ? (STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT) : STATUS_STYLES.DRAFT;

  return (
    <div className='border rounded-xl p-5 bg-gradient-to-br from-background to-muted/20 shadow-sm'>
      <div className='flex items-start justify-between mb-4'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center'>
            <FileText className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
          </div>
          <div>
            <h3 className='font-semibold text-base leading-tight'>{name}</h3>
            {code && <p className='text-xs text-muted-foreground font-mono mt-0.5'>{code}</p>}
          </div>
        </div>
        {status && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusStyle}`}
          >
            {status}
          </span>
        )}
      </div>

      <div className='grid grid-cols-3 gap-3'>
        <div className='flex flex-col items-center p-3 rounded-lg bg-muted/30 border text-center'>
          <Tag className='w-4 h-4 text-muted-foreground mb-1' />
          <span className='text-xs text-muted-foreground'>Role</span>
          <span className='text-sm font-medium mt-0.5 truncate w-full text-center' title={role}>
            {role}
          </span>
        </div>
        <div className='flex flex-col items-center p-3 rounded-lg bg-muted/30 border text-center'>
          <Clock className='w-4 h-4 text-muted-foreground mb-1' />
          <span className='text-xs text-muted-foreground'>Duration</span>
          <span className='text-sm font-semibold mt-0.5'>
            {durationMinutes}
            <span className='text-xs font-normal text-muted-foreground'> min</span>
          </span>
        </div>
        <div className='flex flex-col items-center p-3 rounded-lg bg-muted/30 border text-center'>
          <Hash className='w-4 h-4 text-muted-foreground mb-1' />
          <span className='text-xs text-muted-foreground'>Questions</span>
          <span className='text-sm font-semibold mt-0.5'>{totalQuestions}</span>
        </div>
      </div>
    </div>
  );
}
