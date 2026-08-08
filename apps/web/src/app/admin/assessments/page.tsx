'use client';

import React, { useState, useMemo } from 'react';
import { useConfigs } from '@/services/exam-configs/hooks';
import {
  useActivateAssessment,
  useDeactivateAssessment,
} from '@/modules/admin-analytics/hooks/useRecentAssessments';
import { SectionHeader } from '@/components/ui/section-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  FileText,
  CheckCircle2,
  Power,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  RefreshCw,
  Clock,
  HelpCircle,
  FolderKanban,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import type { ExamConfig } from '@/services/exam-configs/types';

function isConfigActive(item: any): boolean {
  if (
    item.isArchived === true ||
    item.status === 'ARCHIVED' ||
    item.status === 'DRAFT' ||
    item.isActive === false
  ) {
    return false;
  }
  return item.status === 'PUBLISHED' || item.status === 'ACTIVE' || item.isActive === true;
}

function AssessmentRowActions({ row }: { row: ExamConfig }) {
  const router = useRouter();
  const activateMutation = useActivateAssessment();
  const deactivateMutation = useDeactivateAssessment();

  const handleView = () => {
    if (!row.id || typeof row.id !== 'string' || row.id.trim() === '') {
      toast.error('Invalid assessment ID. Unable to view assessment report.');
      return;
    }
    router.push(`/admin/reports/assessment/${encodeURIComponent(row.id)}`);
  };

  const handleEdit = () => {
    if (!row.id || typeof row.id !== 'string' || row.id.trim() === '') {
      toast.error('Invalid assessment ID. Unable to open assessment editor.');
      return;
    }
    router.push(`/admin/assessment-builder?assessmentId=${encodeURIComponent(row.id)}`);
  };

  const isActive = isConfigActive(row);

  return (
    <div className='flex justify-end gap-1.5'>
      <Button
        size='icon'
        variant='ghost'
        className='size-7 h-7 w-7 rounded-md hover:bg-muted'
        onClick={handleView}
        title='View Assessment Report'
      >
        <Eye className='size-3.5' />
      </Button>
      <Button
        size='icon'
        variant='ghost'
        className='size-7 h-7 w-7 rounded-md hover:bg-muted text-indigo-600 dark:text-indigo-400'
        onClick={handleEdit}
        title='Edit Assessment Configuration'
      >
        <Edit className='size-3.5' />
      </Button>
      {isActive ? (
        <ConfirmationDialog
          title='Deactivate Assessment'
          description={`Are you sure you want to deactivate "${row.name}"? Candidates will no longer be able to initiate new test attempts for this assessment.`}
          confirmLabel='Deactivate'
          destructive={true}
          isLoading={deactivateMutation.isPending}
          onConfirm={async () => {
            await deactivateMutation.mutateAsync(row.id);
          }}
          trigger={
            <Button
              size='icon'
              variant='ghost'
              className='size-7 h-7 w-7 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20'
              title='Deactivate Assessment'
            >
              <Power className='size-3.5' />
            </Button>
          }
        />
      ) : (
        <ConfirmationDialog
          title='Activate Assessment'
          description={`Are you sure you want to activate "${row.name}"? This will make the assessment publicly available for testing sessions.`}
          confirmLabel='Activate'
          isLoading={activateMutation.isPending}
          onConfirm={async () => {
            await activateMutation.mutateAsync(row.id);
          }}
          trigger={
            <Button
              size='icon'
              variant='ghost'
              className='size-7 h-7 w-7 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
              title='Activate Assessment'
            >
              <CheckCircle2 className='size-3.5' />
            </Button>
          }
        />
      )}
    </div>
  );
}

const columns: ColumnDef<ExamConfig>[] = [
  {
    id: 'name',
    header: 'Assessment Name',
    cell: (row) => (
      <div className='flex flex-col'>
        <span className='font-semibold text-foreground text-sm'>{row.name}</span>
        {row.code && <span className='text-xs text-muted-foreground font-mono'>{row.code}</span>}
      </div>
    ),
  },
  {
    id: 'role',
    header: 'Target Role',
    cell: (row) => (
      <span className='text-xs font-medium bg-muted/50 px-2.5 py-1 rounded-md text-foreground'>
        {row.role || 'General Candidate'}
      </span>
    ),
  },
  {
    id: 'duration',
    header: 'Duration',
    cell: (row) => (
      <span className='text-xs text-muted-foreground flex items-center gap-1'>
        <Clock className='size-3.5 text-blue-500' />
        {row.durationMinutes ? `${row.durationMinutes} mins` : 'Untimed'}
      </span>
    ),
  },
  {
    id: 'questions',
    header: 'Questions',
    cell: (row) => (
      <span className='text-xs text-muted-foreground flex items-center gap-1 font-semibold'>
        <HelpCircle className='size-3.5 text-amber-500' />
        {row.totalQuestions ?? 0} items
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => {
      const isAct = isConfigActive(row);
      const statusLabel = row.status || (isAct ? 'PUBLISHED' : 'DRAFT');

      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
      if (isAct) variant = 'default';
      else if (statusLabel === 'ARCHIVED') variant = 'destructive';
      else variant = 'secondary';

      return (
        <Badge variant={variant} className='text-[10px] font-semibold tracking-wider uppercase'>
          {statusLabel}
        </Badge>
      );
    },
  },
  {
    id: 'createdAt',
    header: 'Created Date',
    cell: (row) => (
      <span className='text-xs text-muted-foreground'>
        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
      </span>
    ),
  },
  {
    id: 'actions',
    header: <div className='text-right'>Actions</div>,
    className: 'text-right',
    cell: (row) => <AssessmentRowActions row={row} />,
  },
];

export default function AdminAssessmentsPage() {
  const router = useRouter();
  const { data: configs, isLoading, isError, refetch, isFetching } = useConfigs();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredConfigs = useMemo(() => {
    if (!configs) return [];
    return configs.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.role && item.role.toLowerCase().includes(searchQuery.toLowerCase()));

      const isAct = isConfigActive(item);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isAct) ||
        (statusFilter === 'inactive' && !isAct);

      return matchesSearch && matchesStatus;
    });
  }, [configs, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    if (!configs) return { total: 0, active: 0, inactive: 0 };
    const active = configs.filter(isConfigActive).length;
    return {
      total: configs.length,
      active,
      inactive: configs.length - active,
    };
  }, [configs]);

  return (
    <div className='space-y-8 container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl animate-fade-in-up pb-12'>
      <SectionHeader
        title='Assessment Management'
        description='Configure, activate, and manage AI-driven skill assessments and examination structures.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Assessments' }]}
        actions={
          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => refetch()}
              disabled={isFetching}
              className='gap-2'
            >
              <RefreshCw className='size-4' />
              Refresh
            </Button>
            <Button asChild size='sm' className='gap-2 shadow-sm'>
              <Link href='/admin/assessment-builder'>
                <Plus className='size-4' />
                New Assessment
              </Link>
            </Button>
          </div>
        }
      />

      {/* Summary Stat Cards */}
      <div className='grid gap-5 sm:grid-cols-3'>
        <StatCard
          title='Total Assessments'
          value={stats.total.toString()}
          icon={<FolderKanban className='size-5 text-indigo-500' />}
          description='Total configured test blueprints'
        />
        <StatCard
          title='Active & Published'
          value={stats.active.toString()}
          icon={<CheckCircle2 className='size-5 text-emerald-500' />}
          description='Available for candidate evaluation'
        />
        <StatCard
          title='Drafts & Archived'
          value={stats.inactive.toString()}
          icon={<FileText className='size-5 text-amber-500' />}
          description='Pending validation or retired'
        />
      </div>

      {/* Main Table Card */}
      <Card className='rounded-xl shadow-sm border border-border'>
        <CardHeader className='p-5 border-b bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div>
            <CardTitle className='text-base font-semibold text-foreground flex items-center gap-2'>
              <FileText className='size-4 text-primary' />
              Configured Assessments Directory
            </CardTitle>
            <CardDescription className='text-xs text-muted-foreground mt-1'>
              Click any action icon to inspect assessment performance reports, modify test
              parameters, or toggle availability.
            </CardDescription>
          </div>

          <div className='flex flex-wrap items-center gap-3 w-full sm:w-auto'>
            <div className='relative flex-1 sm:w-64'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
              <input
                type='text'
                placeholder='Search assessments...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground'
              />
            </div>

            <div className='flex items-center gap-2 border border-input rounded-lg px-2.5 py-1.5 bg-background'>
              <Filter className='size-3.5 text-muted-foreground' />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className='bg-transparent text-xs text-foreground focus:outline-none font-medium'
              >
                <option value='all'>All Statuses</option>
                <option value='active'>Published / Active</option>
                <option value='inactive'>Draft / Archived</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className='p-0'>
          {isError ? (
            <div className='py-12'>
              <EmptyState
                variant='error'
                title='Failed to load assessments'
                description='An error occurred while fetching your assessment configurations from the server.'
                actionLabel='Retry Fetch'
                onAction={refetch}
              />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredConfigs}
              isLoading={isLoading}
              rowKey={(row) => row.id}
              containerClassName='border-0 rounded-none'
              emptyState={
                <div className='py-12'>
                  <EmptyState
                    variant='no-data'
                    title='No Assessments Matching Criteria'
                    description='You currently have no assessment configurations matching your search or filters.'
                    actionLabel='Create First Assessment'
                    onAction={() => router.push('/admin/assessment-builder')}
                  />
                </div>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
