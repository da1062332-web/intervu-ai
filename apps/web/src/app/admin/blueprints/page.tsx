import { Metadata } from 'next';
import { ConfigHeader } from '@/components/admin/config/config-header';
import { BlueprintListPageClient } from './BlueprintListPageClient';

export const metadata: Metadata = {
  title: 'Exam Blueprints | Admin',
  description: 'Manage exam blueprints, topic weights, and difficulty distributions',
};

export default function BlueprintsPage() {
  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl'>
      <ConfigHeader
        title='Exam Blueprints'
        description='Design blueprints, allocate topic percentages, and select style profiles.'
        actionHref='/admin/blueprints/builder'
        actionLabel='Open Blueprint Builder'
      />
      <BlueprintListPageClient />
    </div>
  );
}
