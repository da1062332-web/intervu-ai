import type { Metadata } from 'next';
import { Download } from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { ResultsView } from '@/components/results/ResultsView';

export const metadata: Metadata = {
  title: 'Results — InterVu AI',
  description: 'View candidate assessment results and performance analytics.',
};

export default function ResultsPage() {
  return (
    <div className='space-y-6'>
      <PageHeader
        title='Results'
        subtitle='Review completed assessments and candidate performance data.'
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Results' }]}
        action={
          <Button variant='outline' size='sm' className='gap-2' id='export-results-btn'>
            <Download className='size-4' />
            Export
          </Button>
        }
      />

      {/* Summary row placeholder */}
      <div className='grid gap-4 sm:grid-cols-3'>
        {(['Total Evaluated', 'Pass Rate', 'Avg. Score'] as const).map((label) => (
          <div key={label} className='rounded-2xl border border-border bg-card p-5 shadow-sm'>
            <p className='text-sm text-muted-foreground'>{label}</p>
            <p className='mt-2 text-2xl font-heading font-bold text-foreground'>—</p>
          </div>
        ))}
      </div>

      {/* Interactive Results View */}
      <ResultsView />
    </div>
  );
}
