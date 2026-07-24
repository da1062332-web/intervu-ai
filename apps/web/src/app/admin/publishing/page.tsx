'use client';

import React from 'react';
import { SectionHeader } from '@/components/ui/section-header';

export default function PublishingCenterPage() {
  return (
    <div className='container mx-auto py-8 max-w-7xl'>
      <SectionHeader 
        title='Publishing Center'
        description='Manage, publish, and rollback assembled tests globally.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Publishing' }]}
      />

      <div className='bg-card rounded-lg border p-12 text-center text-muted-foreground'>
        Publishing Center implementation coming soon.
      </div>
    </div>
  );
}
