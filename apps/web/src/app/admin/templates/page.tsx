import { Metadata } from 'next';
import { TemplateListPageClient } from './TemplateListPageClient';

export const metadata: Metadata = {
  title: 'Templates | Admin',
  description: 'Manage generation templates',
};

export default function TemplatesPage() {
  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl'>
      <TemplateListPageClient />
    </div>
  );
}
