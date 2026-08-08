import { Metadata } from 'next';
import { SectionHeader } from '@/components/ui/section-header';
import { BlueprintListPageClient } from './BlueprintListPageClient';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Exam Blueprints | Admin',
  description: 'Manage exam blueprints, topic weights, and difficulty distributions',
};

export default function BlueprintsPage() {
  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl'>
      <SectionHeader
        title='Exam Blueprints'
        description='Design blueprints, allocate topic percentages, and select style profiles.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Blueprints' }]}
        actions={
          <Button asChild>
            <Link href='/admin/blueprints/new'>
              <Plus className='w-4 h-4 mr-2' />
              Create Blueprint
            </Link>
          </Button>
        }
      />
      <BlueprintListPageClient />
    </div>
  );
}
