import { useRecentAssessments } from '../../hooks/useRecentAssessments';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import type { RecentAssessment } from '../../services/dashboard.service';
import Link from 'next/link';

const columns: ColumnDef<RecentAssessment>[] = [
  {
    id: 'name',
    header: 'Assessment',
    cell: (row) => <span className='font-medium text-foreground'>{row.assessmentName}</span>,
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
];

const EMPTY_RECENT_ASSESSMENTS: RecentAssessment[] = [];

export function RecentAssessmentsTable() {
  const { data, isLoading, isError, refetch } = useRecentAssessments();

  if (isError) {
    return (
      <Card className='rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px] items-center justify-center'>
        <EmptyState
          variant='error'
          title='Failed to load recent assessments'
          description='There was an error loading the recent assessments.'
          actionLabel='Try again'
          onAction={refetch}
        />
      </Card>
    );
  }

  return (
    <Card className='rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]'>
      <CardHeader className='py-3 px-5 border-b bg-card z-20 flex flex-row items-center justify-between'>
        <CardTitle className='text-base font-semibold'>Recent Assessments</CardTitle>
        <Button
          variant='ghost'
          size='sm'
          asChild
          className='text-xs h-8 text-muted-foreground hover:text-foreground'
        >
          <Link href='/admin/assessments'>
            View All <ChevronRight className='ml-1 size-3' />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className='p-0 flex-1 overflow-hidden'>
        <DataTable
          columns={columns}
          data={data ?? EMPTY_RECENT_ASSESSMENTS}
          isLoading={isLoading}
          disablePagination
          rowKey={(row) => row.id}
          containerClassName='h-full border-0 rounded-none'
          emptyState={
            <div className='py-12'>
              <EmptyState
                variant='no-data'
                title='No recent assessments'
                description='Your recently created assessments will appear here.'
                compact
              />
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
