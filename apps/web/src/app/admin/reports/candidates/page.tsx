'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AnimatedLoader } from '@/components/ui/animated-loader';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Eye, Search, Filter, Download } from 'lucide-react';
import { apiClient } from '@/services/api/client';

interface CandidateReport {
  id: string;
  candidate: { id: string; fullName: string; email: string };
  assessment: { id: string; displayName: string };
  score: number;
  completedAt: string;
}

export default function AdminCandidateReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<CandidateReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [sortBy, setSortBy] = useState('completedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const data = await apiClient.request<CandidateReport[]>('/admin/reports/candidates', {
          query: {
            search: searchTerm,
            sortBy,
            sortOrder,
            limit: 50,
          },
        });
        setReports(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Add a simple debounce for searching
    const timer = setTimeout(() => {
      fetchReports();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, sortBy, sortOrder]);

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const columns: ColumnDef<CandidateReport>[] = [
    {
      id: 'candidate',
      header: 'Candidate',
      cell: (row) => (
        <div>
          <p className='font-medium text-gray-900'>{row.candidate.fullName || 'Candidate'}</p>
          <p className='text-xs text-gray-500'>{row.candidate.email}</p>
        </div>
      ),
    },
    {
      id: 'assessment',
      header: 'Assessment',
      cell: (row) => <span className='text-gray-700'>{row.assessment.displayName}</span>,
    },
    {
      id: 'score',
      header: 'Score',
      cell: (row) => <span className='font-semibold text-indigo-600'>{row.score}</span>,
    },
    {
      id: 'completedAt',
      header: 'Completed Date',
      cell: (row) => <span className='text-gray-700'>{new Date(row.completedAt).toLocaleDateString()}</span>,
    },
    {
      id: 'actions',
      header: <div className="text-right">Action</div>,
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push(`/admin/results/${row.id}`)}
          >
            <Eye className='w-4 h-4 mr-2' />
            View
          </Button>
          <Button
            variant='ghost'
            size='sm'
            className='text-primary'
            onClick={async (e) => {
              const btn = e.currentTarget;
              const originalText = btn.innerHTML;
              try {
                btn.innerHTML = '<span class="animate-pulse">...</span>';
                btn.disabled = true;
                const blob = await apiClient.request<Blob>(`/reports/export/pdf/${row.id}`, {
                  responseType: 'blob'
                });
                const url = URL.createObjectURL(blob as any);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Report-${row.id}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              } catch (err) {
                console.error(err);
              } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
              }
            }}
          >
            <Download className='w-4 h-4 mr-2' />
            Report
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6'>
      <SectionHeader
        title='Candidate Reports Explorer'
        description='View and filter candidate assessment results'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Reports' }, { label: 'Candidates' }]}
      />

      <Card>
        <CardHeader className='pb-3 border-b'>
          <div className='flex flex-col sm:flex-row justify-between gap-4 items-center'>
            <div className='relative w-full sm:max-w-xs'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-500' />
              <Input
                type='text'
                placeholder='Search candidates or assessments...'
                className='pl-9'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant='outline'>
              <Filter className='w-4 h-4 mr-2' />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <DataTable
            columns={columns}
            data={reports}
            isLoading={loading}
            rowKey={(row) => row.id}
            containerClassName="border-0 rounded-none"
            emptyState={
              <EmptyState
                variant="no-data"
                title='No Reports Found'
                description='No candidate reports matched your search criteria.'
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
