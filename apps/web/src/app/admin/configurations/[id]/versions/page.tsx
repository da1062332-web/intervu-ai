'use client';

import { useParams } from 'next/navigation';
import { VersionHistory } from '@/modules/admin/configuration/VersionHistory';
import { SectionHeader } from '@/components/ui/section-header';

export default function VersionsPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || '';

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-6xl'>
      <SectionHeader
        title='Version History'
        description='View, compare, and restore previous configuration versions.'
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Configurations', href: '/admin/configurations' },
          { label: 'Configuration', href: `/admin/configurations/${id}` },
          { label: 'Versions' },
        ]}
      />
      <VersionHistory configId={id} />
    </div>
  );
}
