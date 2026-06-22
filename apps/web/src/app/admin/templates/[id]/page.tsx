'use client';

import { useParams, useRouter } from 'next/navigation';
import { SolutionTemplateTab } from './components/SolutionTemplateTab';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TemplatePage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className='container mx-auto py-6 space-y-8 max-w-5xl'>
      <div className='flex items-center gap-4'>
        <Link
          href={`/admin/templates`}
          className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors'
        >
          <ArrowLeft className='w-5 h-5' />
        </Link>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Template Editor</h1>
          <p className='text-muted-foreground'>Manage your template and solution configurations.</p>
        </div>
      </div>

      <div className='border rounded-lg p-6 bg-white dark:bg-gray-900 shadow-sm'>
        <SolutionTemplateTab />
      </div>
    </div>
  );
}
