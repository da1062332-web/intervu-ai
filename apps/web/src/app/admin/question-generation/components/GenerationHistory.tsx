import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGenerationHistory } from '@/services/question-generation/hooks';
import { Skeleton } from '@/components/ui/skeleton';

export function GenerationHistory() {
  const { data: history, isLoading } = useGenerationHistory();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Generations</CardTitle>
        <CardDescription>History of recent single and batch question generations.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !history || history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md border-dashed">
            No generation history found.
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Template ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Generated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{entry.templateId}</TableCell>
                    <TableCell>{entry.batchSize > 1 ? 'Batch' : 'Single'}</TableCell>
                    <TableCell>
                      <Badge variant={entry.status === 'Completed' ? 'default' : 'destructive'}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.successCount} / {entry.batchSize}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
