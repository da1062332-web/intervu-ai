import type { Metadata } from 'next';
import { Download, BarChart3 } from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Button } from '@/components/ui/button';

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

      {/* Results list empty state */}
      <div className='rounded-2xl border border-dashed border-border bg-muted/20 min-h-[380px] flex items-center justify-center'>
        <EmptyState
          icon={<BarChart3 className='size-7 text-muted-foreground' />}
          title='No results yet'
          description='Once candidates complete your assessments, their results will appear here.'
        />
      </div>
    </div>
  );
}
