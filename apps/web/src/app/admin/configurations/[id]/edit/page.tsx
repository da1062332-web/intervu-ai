'use client';
import { useParams } from 'next/navigation';
import { EditConfigClient } from './EditConfigClient';
export default function EditConfigPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || '';
  return <EditConfigClient configId={id} />;
}