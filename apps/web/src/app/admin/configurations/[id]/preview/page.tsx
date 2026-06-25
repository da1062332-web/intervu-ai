'use client';

import { ConfigurationPreview } from '@/modules/admin/configuration/ConfigurationPreview';

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const resolvedParams = await params;
  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-5xl'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold tracking-tight'>Configuration Preview</h1>
        <p className='text-muted-foreground mt-1'>Review downstream impact before publishing.</p>
      </div>
      <ConfigurationPreview configId={resolvedParams.id} />
    </div>
  );
}
