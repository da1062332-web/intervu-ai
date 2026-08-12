import { useRecentTestAttempts } from '../../hooks/useRecentTestAttempts';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, EmptyStateCard } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, Eye } from 'lucide-react';
import type { RecentTestAttempt } from '../../services/dashboard.service';
import { cn } from '@/lib/utils';

const columns: ColumnDef<RecentTestAttempt>[] = [
  {
    id: 'candidate',
    header: 'Candidate',
    cell: (row) => (
      <div className='flex flex-col'>
        <span className='font-medium text-foreground'>{row.candidateName}</span>
        {row.email && <span className='text-xs text-muted-foreground'>{row.email}</span>}
      </div>
    ),
  },
  {
    id: 'assessment',
    header: 'Assessment',
    cell: (row) => <span className='text-muted-foreground font-medium'>{row.assessment}</span>,
  },
  {
    id: 'score',
    header: 'Score',
    cell: (row: any) => {
      if (!row.hasEvaluation && row.score === 0) {
        return (
          <span className='px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border/60'>
            Pending Eval
          </span>
        );
      }

      let colorClass =
        'text-amber-700 bg-amber-500/10 dark:text-amber-300 border border-amber-500/20';
      if (row.score >= 80)
        colorClass =
          'text-emerald-700 bg-emerald-500/10 dark:text-emerald-300 border border-emerald-500/20';
      else if (row.score >= 60)
        colorClass = 'text-blue-700 bg-blue-500/10 dark:text-blue-300 border border-blue-500/20';
      else if (row.score < 50)
        colorClass = 'text-destructive bg-destructive/10 border border-destructive/20';

      return (
        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold', colorClass)}>
          {row.score} {row.score <= 100 ? '/ 100' : 'pts'}
        </span>
      );
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <Badge
        variant='outline'
        className={
          row.status === 'COMPLETED'
            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]'
            : 'text-[10px]'
        }
      >
        {row.status}
      </Badge>
    ),
  },
  {
    id: 'submittedAt',
    header: 'Submitted',
    cell: (row) => (
      <span className='text-xs text-muted-foreground'>
        {new Date(row.submittedAt).toLocaleDateString()}
      </span>
    ),
  },
  {
    id: 'actions',
    header: '',
    className: 'text-right',
    cell: (row) => (
      <div className='flex justify-end'>
        {row.id || row.attemptId ? (
          <Button
            asChild
            size='icon'
            variant='ghost'
            className='size-7 h-7 w-7'
            title='View Detail Report'
          >
            <Link href={`/admin/results/${row.id || row.attemptId}`}>
              <Eye className='size-3.5 text-muted-foreground hover:text-primary transition-colors' />
            </Link>
          </Button>
        ) : null}
      </div>
    ),
  },
];

export function RecentTestAttemptsTable() {
  const { data, isLoading, isError, refetch } = useRecentTestAttempts();

  if (isError) {
    return (
      <Card className='rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px] items-center justify-center'>
        <EmptyState
          variant='error'
          title='Failed to load test attempts'
          description='There was an error loading the recent test attempts.'
          actionLabel='Try again'
          onAction={refetch}
        />
      </Card>
    );
  }

  return (
    <Card className='rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]'>
      <CardHeader className='py-3 px-5 border-b bg-card z-20 flex flex-row items-center justify-between'>
        <CardTitle className='text-base font-semibold'>Recent Test Attempts</CardTitle>
        <Button
          variant='ghost'
          size='sm'
          asChild
          className='text-xs h-8 text-muted-foreground hover:text-foreground'
        >
          <Link href='/admin/results'>
            View All <ChevronRight className='ml-1 size-3' />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className='p-0 flex-1 overflow-hidden'>
        <DataTable
          columns={columns}
          data={data ?? []}
          isLoading={isLoading}
          disablePagination
          rowKey={(row) => (row.id || row.attemptId) as string}
          containerClassName='h-full border-0 rounded-none'
          emptyState={
            <div className='py-12'>
              <EmptyState
                variant='no-data'
                title='No recent attempts'
                description='Test attempts by candidates will appear here.'
                compact
              />
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
