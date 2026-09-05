import { ConfigurationPreview } from '@/modules/admin/configuration/ConfigurationPreview';
import { SectionHeader } from '@/components/ui/section-header';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function PreviewPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id || '';

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-5xl'>
      <SectionHeader
        title='Configuration Preview'
        description='Review downstream impact before publishing.'
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Configurations', href: '/admin/configurations' },
          { label: 'Preview' },
        ]}
      />
      <ConfigurationPreview configId={id} />
    </div>
  );
}
