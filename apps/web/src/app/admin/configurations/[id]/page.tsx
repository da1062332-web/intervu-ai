import { ConfigPageClient } from './ConfigPageClient';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function ConfigurationPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id || '';
  return <ConfigPageClient configId={id} />;
}
