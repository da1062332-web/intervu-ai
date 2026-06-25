'use client';

import { VersionHistory } from '@/modules/admin/configuration/VersionHistory';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface VersionsPageProps {
  params: Promise<{ id: string }>;
}

export default async function VersionsPage({ params }: VersionsPageProps) {
  const resolvedParams = await params;
  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-6xl'>
      <div className='mb-6'>
        <Link
          href={`/admin/configurations/${resolvedParams.id}`}
          className='flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors'
        >
          <ArrowLeft className='w-3.5 h-3.5' />
          Back to Configuration
        </Link>
        <h1 className='text-2xl font-bold tracking-tight'>Version History</h1>
        <p className='text-muted-foreground mt-1'>
          View, compare, and restore previous configuration versions.
        </p>
      </div>
      <VersionHistory configId={resolvedParams.id} />
    </div>
  );
}
