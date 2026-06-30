'use client';

import React from 'react';
import { WorkflowDashboard } from '@/modules/workflows';

export default function WorkflowsPage() {
  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Workflow Orchestration</h1>
        <p className="text-muted-foreground mt-2">
          Manage exam generation, review, assembly, and publishing from a centralized dashboard.
        </p>
      </div>
      
      <WorkflowDashboard />
    </div>
  );
}
