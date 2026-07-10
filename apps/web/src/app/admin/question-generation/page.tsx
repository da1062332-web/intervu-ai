import { Metadata } from 'next';
import { GenerationDashboard } from './components/GenerationDashboard';

export const metadata: Metadata = {
  title: 'Question Generation Dashboard',
  description: 'Manage and trigger question generation batches from templates.',
};

export default function QuestionGenerationPage() {
  return (
    <div className='flex-1 space-y-4 p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>Question Generation</h2>
      </div>
      <GenerationDashboard />
    </div>
  );
}
