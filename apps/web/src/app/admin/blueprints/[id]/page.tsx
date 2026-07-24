'use client';

import { useParams } from 'next/navigation';
import { useBlueprint } from '@/services/blueprints/hooks';
import { ValidationDashboard } from '@/app/admin/blueprints/components/ValidationDashboard';
import { PreviewScreen } from '@/app/admin/blueprints/components/PreviewScreen';
import { Button } from '@/components/ui/button';
import { Edit2, Workflow } from 'lucide-react';
import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { DetailPageSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { CustomFormCard } from '@/components/ui/custom-form-card';

export default function BlueprintViewPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: blueprint, isLoading, isError, refetch } = useBlueprint(id);

  if (isLoading) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl'>
        <DetailPageSkeleton />
      </div>
    );
  }

  if (isError || !blueprint) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl'>
        <EmptyState
          variant='error'
          title='Unable to load blueprint'
          description='There was a problem fetching the blueprint details. Please try again.'
          actionLabel='Retry'
          onactions={() => refetch()}
          className='py-12'
        />
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8 animate-fade-in'>
      <SectionHeader
        title='Blueprint Details'
        description='View validation and preview status.'
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Blueprints', href: '/admin/blueprints' },
          { label: blueprint.name || 'Details' }
        ]}
        actions={
          <div className='flex items-center gap-3'>
            <Link href={`/admin/blueprints/${id}/compile`}>
              <Button
                variant='outline'
                className='border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/20'
              >
                <Workflow className='w-4 h-4 mr-2' />
                Compile
              </Button>
            </Link>
            <Link href={`/admin/blueprints/${id}/edit`}>
              <Button>
                <Edit2 className='w-4 h-4 mr-2' />
                Edit
              </Button>
            </Link>
          </div>
        }
      />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <CustomFormCard title='General Info' description='Basic information about this blueprint.'>
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
        </CustomFormCard>

        <CustomFormCard title='Metrics' description='Key statistics and status.'>
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
                <Badge variant={blueprint.isActive ? 'default' : 'secondary'} className={blueprint.isActive ? 'bg-green-100 text-green-800' : ''}>
                  {blueprint.isActive ? 'Active' : 'Draft'}
                </Badge>
              </dd>
            </div>
          </dl>
        </CustomFormCard>
      </div>

      <ValidationDashboard blueprintId={id} />

      <PreviewScreen blueprintId={id} />
    </div>
  );
}
