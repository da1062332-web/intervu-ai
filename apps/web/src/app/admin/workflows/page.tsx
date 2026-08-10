'use client';

import React from 'react';
import { WorkflowDashboard } from '@/modules/workflows';
import { SectionHeader } from '@/components/ui/section-header';

export default function WorkflowsPage() {
  return (
    <div className='container mx-auto py-8 max-w-7xl'>
      <SectionHeader
        title='Workflow Orchestration'
        description='Manage exam generation, review, assembly, and publishing from a centralized dashboard.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Workflows' }]}
      />

      <WorkflowDashboard />
    </div>
  );
}
