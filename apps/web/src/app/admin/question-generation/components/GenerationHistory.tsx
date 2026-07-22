import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { useGenerationHistory } from '@/services/question-generation/hooks';
import { AnimatedLoader } from '@/components/ui/animated-loader';
import { EmptyState } from '@/components/ui/empty-state';

export function GenerationHistory() {
  const { data: history, isLoading } = useGenerationHistory();

  const columns: ColumnDef<any>[] = [
    {
      header: 'Date',
      cell: (row) => (
        <span className="font-medium text-foreground">
          {new Date(row.createdAt).toLocaleDateString()}{' '}
          {new Date(row.createdAt).toLocaleTimeString()}
        </span>
      ),
    },
    {
      header: 'Template ID',
      cell: (row) => <span className="font-mono text-xs text-muted-foreground">{row.templateId}</span>,
    },
    {
      header: 'Type',
      cell: (row) => <span>{row.batchSize > 1 ? 'Batch' : 'Single'}</span>,
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status === 'Completed' ? 'default' : 'destructive'}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Generated',
      className: 'text-right',
      cell: (row) => (
        <span>
          {row.successCount} / {row.batchSize}
        </span>
      ),
    },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Recent Generations</CardTitle>
        <CardDescription>History of recent single and batch question generations.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 border-t">
        {isLoading ? (
          <div className='p-8'>
            <AnimatedLoader variant="table" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={history || []}
            emptyState={
              <EmptyState
                title="No generation history found"
                description="Your recent generations will appear here."
                className="py-12 border-0"
              />
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
