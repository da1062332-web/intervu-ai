import { useRecentAssessments } from '../../hooks/useRecentAssessments';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, EmptyStateCard } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Eye, Edit } from 'lucide-react';
import type { RecentAssessment } from '../../services/dashboard.service';

const columns: ColumnDef<RecentAssessment>[] = [
  {
    id: 'name',
    header: 'Assessment',
    cell: (row) => <span className="font-medium text-foreground">{row.assessmentName}</span>,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => {
      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
      if (row.status === 'PUBLISHED') variant = 'default';
      else if (row.status === 'ARCHIVED') variant = 'destructive';
      else if (row.status === 'DRAFT') variant = 'secondary';
      
      return <Badge variant={variant}>{row.status}</Badge>;
    },
  },
  {
    id: 'candidates',
    header: 'Candidates',
    cell: (row) => <span>{row.candidateCount}</span>,
  },
  {
    id: 'createdDate',
    header: 'Created Date',
    cell: (row) => <span>{new Date(row.createdAt).toLocaleDateString()}</span>,
  },
  {
    id: 'actions',
    header: <div className="text-right">Actions</div>,
    className: "text-right",
    cell: () => (
      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" className="size-7 h-7 w-7 rounded-md">
          <Eye className="size-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="size-7 h-7 w-7 rounded-md">
          <Edit className="size-3.5" />
        </Button>
      </div>
    ),
  },
];

export function RecentAssessmentsTable() {
  const { data, isLoading, isError, refetch } = useRecentAssessments();

  if (isError) {
    return (
      <Card className="rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px] items-center justify-center">
        <EmptyState
          variant="error"
          title="Failed to load recent assessments"
          description="There was an error loading the recent assessments."
          actionLabel="Try again"
          onAction={refetch}
        />
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
      <CardHeader className="py-4 px-5 border-b bg-card z-20">
        <CardTitle className="text-base font-semibold">Recent Assessments</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <DataTable
          columns={columns}
          data={data ?? []}
          isLoading={isLoading}
          disablePagination
          rowKey={(row) => row.id}
          containerClassName="h-full border-0 rounded-none"
          emptyState={
            <div className="py-12">
              <EmptyState
                variant="no-data"
                title="No recent assessments"
                description="Your recently created assessments will appear here."
                compact
              />
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
