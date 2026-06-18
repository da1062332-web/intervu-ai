import { Metadata } from 'next';
import { EditConfigClient } from './EditConfigClient';

export const metadata: Metadata = {
  title: 'Edit Exam Configuration | Admin',
  description: 'Edit an existing exam configuration',
};

interface EditConfigPageProps {
  params: Promise<{ configId: string }>;
}

export default async function EditConfigPage({ params }: EditConfigPageProps) {
  const resolvedParams = await params;
  return <EditConfigClient configId={resolvedParams.configId} />;
}
