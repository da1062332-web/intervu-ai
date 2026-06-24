'use client';

import { useParams } from 'next/navigation';
import { useBlueprint } from '@/services/blueprints/hooks';
import { ValidationDashboard } from '@/app/admin/blueprints/components/ValidationDashboard';
import { PreviewScreen } from '@/app/admin/blueprints/components/PreviewScreen';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit2, Workflow } from 'lucide-react';
import Link from 'next/link';

export default function BlueprintViewPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: blueprint, isLoading, isError, refetch } = useBlueprint(id);

  if (isLoading) {
    return (
      <div className='container mx-auto py-6 space-y-6 max-w-5xl'>
        <Skeleton className='h-12 w-1/3' />
        <Skeleton className='h-32 w-full' />
        <Skeleton className='h-64 w-full' />
      </div>
    );
  }

  if (isError || !blueprint) {
    return (
      <div className='container mx-auto py-12 text-center max-w-5xl'>
        <h2 className='text-lg font-medium text-red-600 mb-2'>Unable to load blueprint.</h2>
        <Button onClick={() => refetch()} variant='outline'>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6 space-y-8 max-w-5xl'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link
            href='/admin/blueprints'
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors'
          >
            <ArrowLeft className='w-5 h-5' />
          </Link>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Blueprint Details</h1>
            <p className='text-muted-foreground'>View validation and preview status.</p>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <Link href={`/admin/blueprints/${id}/compile`}>
            <Button
              variant='outline'
              className='border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/20'
            >
              <Workflow className='w-4 h-4 mr-2' />
              Compile Blueprint
            </Button>
          </Link>
          <Link href={`/admin/blueprints/${id}/edit`}>
            <Button>
              <Edit2 className='w-4 h-4 mr-2' />
              Edit Blueprint
            </Button>
          </Link>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='border rounded-md p-6 bg-white dark:bg-gray-900 shadow-sm'>
          <h3 className='text-sm font-medium text-gray-500 uppercase tracking-wider mb-4'>
            General Info
          </h3>
          <dl className='space-y-4'>
            <div>
              <dt className='text-sm text-muted-foreground'>Name</dt>
              <dd className='font-medium'>{blueprint.name}</dd>
            </div>
            <div>
              <dt className='text-sm text-muted-foreground'>Code</dt>
              <dd className='font-medium'>{blueprint.code}</dd>
            </div>
            <div>
              <dt className='text-sm text-muted-foreground'>Style Profile</dt>
              <dd className='font-medium'>
                {blueprint.styleProfileName || blueprint.styleProfileId}
              </dd>
            </div>
          </dl>
        </div>

        <div className='border rounded-md p-6 bg-white dark:bg-gray-900 shadow-sm'>
          <h3 className='text-sm font-medium text-gray-500 uppercase tracking-wider mb-4'>
            Metrics
          </h3>
          <dl className='space-y-4'>
            <div>
              <dt className='text-sm text-muted-foreground'>Total Questions</dt>
              <dd className='font-medium'>{blueprint.totalQuestions}</dd>
            </div>
            <div>
              <dt className='text-sm text-muted-foreground'>Total Duration</dt>
              <dd className='font-medium'>{blueprint.totalDurationMinutes} mins</dd>
            </div>
            <div>
              <dt className='text-sm text-muted-foreground'>Status</dt>
              <dd>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${blueprint.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                >
                  {blueprint.isActive ? 'Active' : 'Draft'}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <ValidationDashboard blueprintId={id} />

      <PreviewScreen blueprintId={id} />
    </div>
  );
}
