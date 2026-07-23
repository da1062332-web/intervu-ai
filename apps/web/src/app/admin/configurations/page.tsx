import { Metadata } from 'next';
import { SectionHeader } from '@/components/ui/section-header';
import { ConfigsPageClient } from './ConfigsPageClient';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Exam Configurations | Admin',
  description: 'Manage exam configurations for different roles',
};

export default function ConfigsPage() {
  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl'>
      <SectionHeader
        title='Exam Configurations'
        description='Manage and create exam configurations for assessments.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Configurations' }]}
        actions={
          <Button asChild>
            <Link href="/admin/configurations/new">
              <Plus className='w-4 h-4 mr-2' />
              Create Config
            </Link>
          </Button>
        }
      />
      <ConfigsPageClient />
    </div>
  );
}
