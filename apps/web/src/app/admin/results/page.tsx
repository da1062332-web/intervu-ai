'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { SectionHeader } from '@/components/ui/section-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Search,
  Filter,
  Eye,
  RefreshCw,
  UserCheck,
  Award,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface AdminTestAttemptItem {
  id: string;
  candidateName: string;
  email?: string;
  assessment: string;
  score: number;
  hasEvaluation?: boolean;
  status: string;
  submittedAt: string;
}

function useAllAdminTestAttempts() {
  return useQuery<AdminTestAttemptItem[]>({
    queryKey: ['admin-all-test-attempts'],
    queryFn: async () => {
      // Fetch both recent attempts and candidate reports to provide comprehensive attempt history
      const [recentRes, reportsRes] = await Promise.allSettled([
        apiClient.request<{ data: any[] }>('/admin/dashboard/recent-test-attempts', {
          query: { limit: 500 },
        }),
        apiClient.request<any[]>('/admin/reports/candidates', {
          query: { limit: 500 },
        }),
      ]);

      const map = new Map<string, AdminTestAttemptItem>();

      // Populate from recent test attempts endpoint
      if (recentRes.status === 'fulfilled' && recentRes.value?.data) {
        recentRes.value.data.forEach((item, idx) => {
          const key = item.id || `recent-${idx}-${item.candidateName}`;
          map.set(key, {
            id: item.id || key,
            candidateName: item.candidateName || 'Unknown Candidate',
            email: item.email || undefined,
            assessment: item.assessment || 'General Assessment',
            score: typeof item.score === 'number' ? Math.round(item.score * 100) / 100 : 0,
            hasEvaluation: Boolean(item.hasEvaluation),
            status: item.status || 'COMPLETED',
            submittedAt: item.submittedAt || new Date().toISOString(),
          });
        });
      }

      // Merge and enrich from candidate reports endpoint
      if (reportsRes.status === 'fulfilled' && Array.isArray(reportsRes.value)) {
        reportsRes.value.forEach((rep) => {
          if (!rep || !rep.id) return;
          const existing = map.get(rep.id);
          if (existing) {
            existing.email = existing.email || rep.candidate?.email;
            existing.hasEvaluation = true;
          } else {
            map.set(rep.id, {
              id: rep.id,
              candidateName: rep.candidate?.fullName || 'Unknown Candidate',
              email: rep.candidate?.email,
              assessment: rep.assessment?.displayName || 'Assessment Evaluation',
              score: typeof rep.score === 'number' ? Math.round(rep.score * 100) / 100 : 0,
              hasEvaluation: true,
              status: 'COMPLETED',
              submittedAt: rep.completedAt || new Date().toISOString(),
            });
          }
        });
      }

      return Array.from(map.values()).sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    },
    staleTime: 30_000,
  });
}

const columns: ColumnDef<AdminTestAttemptItem>[] = [
  {
    id: 'candidate',
    header: 'Candidate',
    cell: (row) => (
      <div className="flex flex-col">
        <span className="font-semibold text-foreground text-sm">{row.candidateName}</span>
        {row.email ? (
          <span className="text-xs text-muted-foreground">{row.email}</span>
        ) : (
          <span className="text-xs text-muted-foreground/60 italic">No email documented</span>
        )}
      </div>
    ),
  },
  {
    id: 'assessment',
    header: 'Assessment Title',
    cell: (row) => (
      <span className="font-medium text-foreground/90 text-sm">{row.assessment}</span>
    ),
  },
  {
    id: 'score',
    header: 'Overall Score',
    cell: (row) => {
      let colorClass = 'text-orange-700 bg-orange-100 dark:bg-orange-950/60 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      if (row.score >= 80) {
        colorClass = 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      } else if (row.score >= 60) {
        colorClass = 'text-blue-700 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      }

      return (
        <span className={cn('px-2.5 py-1 rounded-md text-xs font-bold border', colorClass)}>
          {row.score} / 100
        </span>
      );
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <Badge
        variant="outline"
        className={cn(
          'text-[10px] uppercase font-semibold tracking-wider',
          row.status === 'COMPLETED' || row.status === 'SUBMITTED' ? 'border-emerald-500/60 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' : 'text-muted-foreground'
        )}
      >
        {row.status}
      </Badge>
    ),
  },
  {
    id: 'submittedAt',
    header: 'Submission Timestamp',
    cell: (row) => {
      const d = new Date(row.submittedAt);
      return (
        <div className="flex flex-col text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">{d.toLocaleDateString()}</span>
          <span>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: <div className="text-right">Actions</div>,
    className: 'text-right',
    cell: (row) => (
      <div className="flex justify-end items-center">
        <Button asChild size="sm" variant="outline" className="gap-1.5 h-8 px-3 shadow-2xs hover:bg-primary hover:text-primary-foreground transition-colors">
          <Link href={`/admin/results/${encodeURIComponent(row.id)}`}>
            <Eye className="size-3.5" />
            <span>View Details</span>
          </Link>
        </Button>
      </div>
    ),
  },
];

export default function AdminRecentTestAttemptsPage() {
  const router = useRouter();
  const { data: attempts, isLoading, isError, refetch, isFetching } = useAllAdminTestAttempts();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAttempts = useMemo(() => {
    if (!attempts) return [];
    return attempts.filter((item) => {
      const matchesSearch =
        item.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.assessment.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        item.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [attempts, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    if (!attempts || attempts.length === 0) {
      return { total: 0, avgScore: 0, completed: 0, highPerformers: 0 };
    }
    const completed = attempts.filter(
      (a) => a.status.toUpperCase() === 'COMPLETED' || a.status.toUpperCase() === 'SUBMITTED'
    ).length;
    const highPerformers = attempts.filter((a) => a.score >= 80).length;
    
    const evaluatedAttempts = attempts.filter((a) => a.hasEvaluation || (a.score && a.score > 0));
    const totalScore = evaluatedAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0);
    const avgScore = evaluatedAttempts.length > 0
      ? Math.round((totalScore / evaluatedAttempts.length) * 100) / 100
      : 0;

    return { total: attempts.length, avgScore, completed, highPerformers };
  }, [attempts]);

  return (
    <div className="space-y-8 container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl animate-fade-in-up pb-12">
      <SectionHeader
        title="Recent Test Attempts"
        description="Monitor candidate testing execution, evaluate grading metrics, and inspect comprehensive diagnostic scorecards for individual test sessions."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Test Attempts' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 shadow-2xs"
          >
            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
            Refresh Data
          </Button>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-4">
        <StatCard
          title="Total Attempts"
          value={stats.total.toString()}
          icon={<BarChart3 className="size-5 text-indigo-500" />}
          description="Total recorded testing sessions"
        />
        <StatCard
          title="Average Score"
          value={`${stats.avgScore}%`}
          icon={<TrendingUp className="size-5 text-blue-500" />}
          description="Platform-wide evaluation mean"
        />
        <StatCard
          title="Completed"
          value={stats.completed.toString()}
          icon={<UserCheck className="size-5 text-emerald-500" />}
          description="Evaluations finalized & graded"
        />
        <StatCard
          title="Top Performers (≥80%)"
          value={stats.highPerformers.toString()}
          icon={<Award className="size-5 text-amber-500" />}
          description="Candidates exceeding excellence benchmark"
        />
      </div>

      {/* Table Directory Card */}
      <Card className="rounded-xl shadow-sm border border-border">
        <CardHeader className="p-5 border-b bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Test Attempts & Results Log
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Click &quot;View Details&quot; to open an individual candidate&apos;s full analytical breakdown and evaluation report.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search candidate or exam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground font-medium"
              />
            </div>

            <div className="flex items-center gap-2 border border-input rounded-lg px-2.5 py-1.5 bg-background">
              <Filter className="size-3.5 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-foreground focus:outline-none font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isError ? (
            <div className="py-12">
              <EmptyState
                variant="error"
                title="Failed to load test attempts"
                description="A server error occurred while retrieving recent candidate test submissions."
                actionLabel="Retry Fetch"
                onAction={refetch}
              />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredAttempts}
              isLoading={isLoading}
              rowKey={(row) => row.id}
              containerClassName="border-0 rounded-none"
              emptyState={
                <div className="py-16">
                  <EmptyState
                    variant="no-data"
                    title="No Matching Test Attempts"
                    description="No test attempts were found matching your current search terms or filter criteria."
                    actionLabel="Reset Filters"
                    onAction={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
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
