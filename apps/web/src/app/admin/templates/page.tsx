import { Metadata } from 'next';
import { TemplateListPageClient } from './TemplateListPageClient';

export const metadata: Metadata = {
  title: 'Template Library | InterVu AI',
  description: 'Manage interview templates.',
};

export default function TemplateListPage() {
  return (
    <div className='flex-1 space-y-4 p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>Template Library</h2>
      </div>
      <TemplateListPageClient />
    </div>
  );
}
