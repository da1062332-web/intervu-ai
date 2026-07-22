import { useRecentTestAttempts } from '../../hooks/useRecentTestAttempts';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, EmptyStateCard } from '@/components/ui/empty-state';
import type { RecentTestAttempt } from '../../services/dashboard.service';
import { cn } from '@/lib/utils';

const columns: ColumnDef<RecentTestAttempt>[] = [
  {
    id: 'candidate',
    header: 'Candidate',
    cell: (row) => <span className="font-medium">{row.candidateName}</span>,
  },
  {
    id: 'assessment',
    header: 'Assessment',
    cell: (row) => <span>{row.assessment}</span>,
  },
  {
    id: 'score',
    header: 'Score',
    cell: (row) => {
      let colorClass = 'text-orange-600 bg-orange-100 dark:bg-orange-950 dark:text-orange-400';
      if (row.score >= 80) colorClass = 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400';
      else if (row.score >= 60) colorClass = 'text-blue-700 bg-blue-100 dark:bg-blue-950 dark:text-blue-400';

      return (
        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', colorClass)}>
          {row.score}%
        </span>
      );
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <Badge variant="outline" className={row.status === 'COMPLETED' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : ''}>
        {row.status}
      </Badge>
    ),
  },
  {
    id: 'submittedAt',
    header: 'Submitted',
    cell: (row) => <span>{new Date(row.submittedAt).toLocaleDateString()}</span>,
  },
];

export function RecentTestAttemptsTable() {
  const { data, isLoading, isError, refetch } = useRecentTestAttempts();

  if (isError) {
    return (
      <Card className="rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px] items-center justify-center">
        <EmptyState
          variant="error"
          title="Failed to load test attempts"
          description="There was an error loading the recent test attempts."
          actionLabel="Try again"
          onAction={refetch}
        />
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
      <CardHeader className="py-4 px-5 border-b bg-card z-20">
        <CardTitle className="text-base font-semibold">Recent Test Attempts</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <DataTable
          columns={columns}
          data={data ?? []}
          isLoading={isLoading}
          rowKey={(row) => `${row.candidateName}-${row.submittedAt}`}
          containerClassName="h-full border-0 rounded-none"
          emptyState={
            <div className="py-12">
              <EmptyState
                variant="no-data"
                title="No recent attempts"
                description="Test attempts by candidates will appear here."
                compact
              />
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
