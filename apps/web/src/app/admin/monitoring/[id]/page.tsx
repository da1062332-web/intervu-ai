'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { LiveMonitoringDashboard } from '@/features/admin/monitoring/components/LiveMonitoringDashboard';

export default function AssessmentLiveMonitoringPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = (params?.id as string) || '';
  // Passed from the overview page's card link so the header can show a real
  // assessment name instead of a raw ID. Falls back gracefully (the
  // dashboard just shows the ID) for direct links/bookmarks without it.
  const name = searchParams?.get('name') || '';

  return <LiveMonitoringDashboard assessmentId={id} assessmentName={name} />;
}
