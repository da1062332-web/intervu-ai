import type { Metadata } from 'next';

import { PageHeader } from '@/components/dashboard/page-header';
import { TestsPageClient } from './_components/tests-page-client';

export const metadata: Metadata = {
  title: 'Tests — InterVu AI',
  description: 'Create and manage your AI-powered interview tests and assessments.',
};

export default function TestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tests"
        subtitle="Create and manage your AI-powered interview assessments."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Tests' }]}
      />

      {/* Interactive client shell: search, toolbar, empty state with CTA */}
      <TestsPageClient />
    </div>
  );
}
