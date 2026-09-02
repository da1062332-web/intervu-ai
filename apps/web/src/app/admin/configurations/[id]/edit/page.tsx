'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ConfigPageClient } from '../ConfigPageClient';

export default function EditConfigPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || '';

  useEffect(() => {
    if (id) {
      router.replace(`/admin/configurations/${id}`);
    }
  }, [id, router]);

  if (!id) return null;

  return <ConfigPageClient configId={id} />;
}
