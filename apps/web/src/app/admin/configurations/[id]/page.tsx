'use client';

import { useParams } from 'next/navigation';
import { ConfigPageClient } from './ConfigPageClient';

export default function ConfigurationPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || '';
  return <ConfigPageClient configId={id} />;
}
