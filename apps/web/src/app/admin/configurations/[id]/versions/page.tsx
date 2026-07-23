'use client';

import { VersionHistory } from '@/modules/admin/configuration/VersionHistory';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';

interface VersionsPageProps {
  params: Promise<{ id: string }>;
}

export default async function VersionsPage({ params }: VersionsPageProps) {
  const resolvedParams = await params;
  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-6xl'>
      <SectionHeader 
        title='Version History'
        description='View, compare, and restore previous configuration versions.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Configurations', href: '/admin/configurations' }, { label: 'Configuration', href: `/admin/configurations/${resolvedParams.id}` }, { label: 'Versions' }]}
      />
      <VersionHistory configId={resolvedParams.id} />
    </div>
  );
}
