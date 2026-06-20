import { Metadata } from 'next';
import { TemplateBuilderPageClient } from './TemplateBuilderPageClient';

export const metadata: Metadata = {
  title: 'Template Schema Builder | Admin',
  description: 'Configure variables, rules, and validate template schemas.',
};

export default async function TemplateBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl'>
      <TemplateBuilderPageClient templateId={resolvedParams.id} />
    </div>
  );
}
