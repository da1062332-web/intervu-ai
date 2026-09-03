'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminBillingIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/billing/plans');
  }, [router]);

  return null;
}
