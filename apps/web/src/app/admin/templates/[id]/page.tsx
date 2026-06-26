'use client';

import { useParams } from 'next/navigation';
import { SolutionTemplateTab } from './components/SolutionTemplateTab';
import { ArrowLeft, ClipboardList, ArrowRight, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTemplates } from '@/services/templates/hooks';

export default function TemplatePage() {
  const params = useParams();
  const id = params.id as string;

  // Fetch the template list to find the matching template details
  const { data: response } = useTemplates(1, 100);
  const template = response?.items?.find((t: any) => t.id === id);

  return (
    <div className='container mx-auto py-6 space-y-6 max-w-5xl'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link
            href='/admin/templates'
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors'
          >
            <ArrowLeft className='w-5 h-5' />
          </Link>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Template Editor</h1>
            <p className='text-muted-foreground'>Manage your template and solution configurations.</p>
          </div>
        </div>
        {/* Primary CTA: Go to Assembly */}
        <Link href='/admin/assembly'>
          <Button className='gap-2 bg-emerald-600 hover:bg-emerald-700 text-white'>
            <ClipboardList className='w-4 h-4' />
            Generate Test Assembly
            <ArrowRight className='w-4 h-4' />
          </Button>
        </Link>
      </div>

      {/* Template Info Card */}
      {template && (
        <div className='flex items-start gap-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm'>
          <div className='p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40'>
            <FileText className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
          </div>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 flex-wrap'>
              <h2 className='font-semibold text-gray-900 dark:text-gray-100 text-lg'>{template.name}</h2>
              <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'>
                {template.difficultyLevel ?? template.difficulty ?? 'MEDIUM'}
              </span>
              {template.isSystem && (
                <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'>
                  System
                </span>
              )}
              {template.isActive && (
                <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'>
                  Active
                </span>
              )}
            </div>
            {template.description && (
              <p className='text-sm text-muted-foreground mt-1'>{template.description}</p>
            )}
            <div className='flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground'>
              {template.templateKey && (
                <span className='font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded'>{template.templateKey}</span>
              )}
              {template.conceptKey && (
                <span>Concept: <strong>{template.conceptKey}</strong></span>
              )}
              {template.questionType && (
                <span>Type: <strong>{template.questionType}</strong></span>
              )}
            </div>
          </div>
          <Link href='/admin/assembly'>
            <Button variant='outline' size='sm' className='gap-1.5 shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400'>
              <ClipboardList className='w-3.5 h-3.5' />
              Assemble
            </Button>
          </Link>
        </div>
      )}

      {/* Solution Template Editor */}
      <div className='border rounded-lg p-6 bg-white dark:bg-gray-900 shadow-sm'>
        <SolutionTemplateTab />
      </div>
    </div>
  );
}
