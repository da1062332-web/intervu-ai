import { Metadata } from 'next';
import { GenerationDashboard } from './components/GenerationDashboard';

export const metadata: Metadata = {
  title: 'Question Generation Dashboard',
  description: 'Manage and trigger question generation batches from templates.',
};

import { SectionHeader } from '@/components/ui/section-header';

export default function QuestionGenerationPage() {
  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8 animate-fade-in-up pb-8'>
      <SectionHeader
        title="Question Generation"
        description="Manage and trigger question generation batches from templates."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Question Generation' }]}
      />
      <GenerationDashboard />
    </div>
  );
}
