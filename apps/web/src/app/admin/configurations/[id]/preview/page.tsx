'use client';

import { useParams } from 'next/navigation';
import { ConfigurationPreview } from '@/modules/admin/configuration/ConfigurationPreview';
import { SectionHeader } from '@/components/ui/section-header';

export default function PreviewPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || '';

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-5xl'>
      <SectionHeader 
        title='Configuration Preview'
        description='Review downstream impact before publishing.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Configurations', href: '/admin/configurations' }, { label: 'Preview' }]}
      />
      <ConfigurationPreview configId={id} />
    </div>
  );
}
