import { ConfigPageClient } from './ConfigPageClient';

interface ConfigPageProps {
  params: Promise<{ configId: string }>;
}

export default async function ConfigPage({ params }: ConfigPageProps) {
  // Unwrap the params promise in the server component
  const resolvedParams = await params;

  return <ConfigPageClient configId={resolvedParams.configId} />;
}
