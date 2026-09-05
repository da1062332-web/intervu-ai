import { VersionHistory } from '@/modules/admin/configuration/VersionHistory';
import { SectionHeader } from '@/components/ui/section-header';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function VersionsPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id || '';

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
