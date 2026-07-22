'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useAttemptHistory } from '../hooks/useAttemptHistory';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Play,
  Eye,
  ArrowUpDown,
  History,
} from 'lucide-react';
import Link from 'next/link';

interface AttemptItem {
  instanceId: string;
  testId?: string;
  assessmentName: string;
  date: string;
  status: string;
  score: number | null;
}

interface AttemptHistoryTableProps {
  showFilters?: boolean;
  defaultLimit?: number;
}

const ActionsCell = ({ attempt }: { attempt: AttemptItem }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = await import('@/services/api/client').then(m => m.apiClient.request<Blob>(`/reports/export/pdf/${attempt.instanceId}`, {
        responseType: 'blob'
      }));
      const url = URL.createObjectURL(blob as any);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report-${attempt.instanceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className='flex items-center justify-end gap-2'>
      {attempt.status === 'COMPLETED' || attempt.status === 'SUBMITTED' ? (
        <>
          <Button size='sm' variant='ghost' asChild className='h-8 px-2'>
            <Link href={`/candidate/results/${attempt.instanceId}`}>
              <Eye className='size-4 mr-1' /> View
            </Link>
          </Button>
          <Button 
            size='sm' 
            variant='ghost' 
            className='h-8 px-2 text-primary'
            onClick={handleDownload}
            isLoading={downloading}
            leftIcon={!downloading ? <Download className='size-4' /> : undefined}
          >
            Report
          </Button>
        </>
      ) : attempt.status === 'IN_PROGRESS' ? (
        <Button size='sm' variant='default' asChild className='h-8 px-2'>
          <Link href={`/candidate/tests/${attempt.instanceId}/execution`}>
            <Play className='size-4 mr-1' /> Continue
          </Link>
        </Button>
      ) : (
        <Button size='sm' variant='ghost' disabled className='h-8 px-2'>
          <Download className='size-4 mr-1' /> Report
        </Button>
      )}
    </div>
  );
};

export function AttemptHistoryTable({
  showFilters = false,
  defaultLimit = 5,
}: AttemptHistoryTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof AttemptItem>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const limit = showFilters ? 20 : defaultLimit;
  const { data, isLoading } = useAttemptHistory(page, limit);

  const toggleSort = useCallback(
    (field: keyof AttemptItem) => {
      if (sortField === field) {
        setSortAsc(!sortAsc);
      } else {
        setSortField(field);
        setSortAsc(true);
      }
    },
    [sortField, sortAsc],
  );

  const processedAttempts = useMemo(() => {
    if (!data?.attempts) return [];
    let result = [...data.attempts] as AttemptItem[];

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter((a) => a.assessmentName.toLowerCase().includes(lower));
    }

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'COMPLETED') {
        result = result.filter((a) => a.status === 'COMPLETED' || a.status === 'SUBMITTED');
      } else {
        result = result.filter((a) => a.status === statusFilter);
      }
    }

    result.sort((a, b) => {
      let valA = a[sortField] as any;
      let valB = b[sortField] as any;

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [data?.attempts, search, statusFilter, sortField, sortAsc]);

  const columns: ColumnDef<AttemptItem>[] = [
    {
      id: 'assessmentName',
      header: (
        <div 
          className='flex items-center gap-1 cursor-pointer hover:text-foreground'
          onClick={() => toggleSort('assessmentName')}
        >
          Assessment <ArrowUpDown className='size-3 opacity-50' />
        </div>
      ),
      cell: (row) => <span className='font-medium'>{row.assessmentName}</span>,
    },
    {
      id: 'date',
      header: (
        <div 
          className='flex items-center gap-1 cursor-pointer hover:text-foreground'
          onClick={() => toggleSort('date')}
        >
          Date <ArrowUpDown className='size-3 opacity-50' />
        </div>
      ),
      cell: (row) => format(new Date(row.date), 'MMM d, yyyy'),
    },
    {
      id: 'status',
      header: (
        <div 
          className='flex items-center gap-1 cursor-pointer hover:text-foreground'
          onClick={() => toggleSort('status')}
        >
          Status <ArrowUpDown className='size-3 opacity-50' />
        </div>
      ),
      cell: (row) => {
        let variant: 'default' | 'success' | 'warning' | 'destructive' | 'outline' = 'default';
        if (row.status === 'COMPLETED' || row.status === 'SUBMITTED') variant = 'success';
        else if (row.status === 'IN_PROGRESS') variant = 'default';
        else variant = 'outline';
        
        return (
          <Badge variant={variant} className="rounded-full px-2 py-0.5">
            {row.status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      id: 'score',
      className: 'text-right',
      header: (
        <div 
          className='flex items-center justify-end gap-1 cursor-pointer hover:text-foreground'
          onClick={() => toggleSort('score')}
        >
          Score <ArrowUpDown className='size-3 opacity-50' />
        </div>
      ),
      cell: (row) => <span className='font-medium'>{row.score !== null ? `${row.score}%` : '-'}</span>,
    },
    {
      id: 'actions',
      className: 'text-right',
      header: 'Actions',
      cell: (row) => <ActionsCell attempt={row} />,
    },
  ];

  return (
    <Card className='flex flex-col h-full'>
      <CardHeader className='flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4'>
        <CardTitle>Attempt History</CardTitle>
      </CardHeader>
      <CardContent className='flex-1 flex flex-col'>
        <DataTable
          columns={columns}
          data={processedAttempts}
          isLoading={isLoading}
          rowKey={(row) => row.instanceId}
          search={showFilters && (
            <div className='flex flex-wrap items-center gap-2 mb-4'>
              <Input
                placeholder='Search assessments...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-[180px] sm:w-[220px] text-sm'
                startIcon={<Search className='size-4' />}
              />
              <select
                className='h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value='ALL'>All Status</option>
                <option value='COMPLETED'>Completed</option>
                <option value='IN_PROGRESS'>In Progress</option>
                <option value='EVALUATING'>Evaluating</option>
              </select>
            </div>
          )}
          emptyState={
            <EmptyState
              title={!data?.attempts || data.attempts.length === 0 ? 'No Attempt History' : 'No Results'}
              description={!data?.attempts || data.attempts.length === 0 ? 'No attempt history found.' : 'No matching attempts found on this page.'}
              icon={!data?.attempts || data.attempts.length === 0 ? <History className='size-8 text-muted-foreground' /> : <Search className='size-8 text-muted-foreground' />}
              variant='no-data'
            />
          }
          pagination={
            data && data.pagination.totalPages > 1 && (
              <div className='flex items-center space-x-2 mt-4'>
                <div className='text-sm text-muted-foreground mr-4'>
                  Showing page {page} of {data.pagination.totalPages}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  leftIcon={<ChevronLeft className='size-4' />}
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                  rightIcon={<ChevronRight className='size-4' />}
                >
                  Next
                </Button>
              </div>
            )
          }
        />
      </CardContent>
    </Card>
  );
}
