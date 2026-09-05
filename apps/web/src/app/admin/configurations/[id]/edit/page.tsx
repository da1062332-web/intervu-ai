import { EditConfigClient } from './EditConfigClient';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function EditConfigPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id || '';

  if (!id) return null;

  return <EditConfigClient configId={id} />;
}