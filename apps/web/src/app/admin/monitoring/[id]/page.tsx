'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { LiveMonitoringDashboard } from '@/features/admin/monitoring/components/LiveMonitoringDashboard';

export default function AssessmentLiveMonitoringPage() {
  const params = useParams();
  const id = (params?.id as string) || '';

  return <LiveMonitoringDashboard assessmentId={id} />;
}
