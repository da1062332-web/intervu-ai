import { Metadata } from 'next';
import { ConfigHeader } from '@/components/admin/config/config-header';
import { ConfigsPageClient } from './ConfigsPageClient';

export const metadata: Metadata = {
  title: 'Exam Configurations | Admin',
  description: 'Manage exam configurations for different roles',
};

export default function ConfigsPage() {
  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl'>
      <ConfigHeader
        title='Exam Configurations'
        description='Manage and create exam configurations for assessments.'
        actionHref='/admin/configurations/new'
        actionLabel='Create Config'
      />
      <ConfigsPageClient />
    </div>
  );
}
