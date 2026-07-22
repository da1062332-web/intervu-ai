import { Metadata } from 'next';
import { GenerationDashboard } from './components/GenerationDashboard';

export const metadata: Metadata = {
  title: 'Question Generation Dashboard',
  description: 'Manage and trigger question generation batches from templates.',
};

import { PageHeader } from '@/components/admin/dashboard/page-header';

export default function QuestionGenerationPage() {
  return (
    <div className='flex-1 space-y-4 animate-fade-in'>
      <PageHeader
        title="Question Generation"
        subtitle="Manage and trigger question generation batches from templates."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Question Generation' }]}
      />
      <GenerationDashboard />
    </div>
  );
}
