import { ConfigPageClient } from './ConfigPageClient';

interface ConfigurationPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConfigurationPage({ params }: ConfigurationPageProps) {
  const resolvedParams = await params;
  return <ConfigPageClient configId={resolvedParams.id} />;
}
