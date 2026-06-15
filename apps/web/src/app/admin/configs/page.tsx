import { Metadata } from 'next';
import { ConfigHeader } from '@/components/admin/config/config-header';
import { ConfigTable, ExamConfig } from '@/components/admin/config/config-table';

export const metadata: Metadata = {
  title: 'Exam Configurations | Admin',
  description: 'Manage exam configurations for different roles',
};

// Mock data
const mockConfigs: ExamConfig[] = [
  {
    id: '1',
    name: 'Software Engineer Screening',
    role: 'Software Engineer',
    durationMinutes: 60,
    totalQuestions: 30,
    status: 'Draft',
    createdAt: '2023-10-27T10:00:00Z',
  },
];

export default function ConfigsPage() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <ConfigHeader
        title="Exam Configurations"
        description="Manage and create exam configurations for assessments."
        actionHref="/admin/configs/new"
        actionLabel="Create Config"
      />
      <div className="mt-8">
        <ConfigTable configs={mockConfigs} />
      </div>
    </div>
  );
}
