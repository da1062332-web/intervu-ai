import { Metadata } from 'next';
import { ConfigHeader } from '@/components/admin/config/config-header';
import { ConfigForm } from '@/components/admin/config/config-form';

export const metadata: Metadata = {
  title: 'Create Exam Configuration | Admin',
  description: 'Create a new exam configuration',
};

export default function NewConfigPage() {
  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl'>
      <ConfigHeader
        title='Create Configuration'
        description='Set up a new exam configuration with duration, role, and questions.'
      />
      <div className='mt-8 bg-card p-6 rounded-lg border shadow-sm'>
        <ConfigForm />
      </div>
    </div>
  );
}
