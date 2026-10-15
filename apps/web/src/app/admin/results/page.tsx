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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CandidateResultModal } from '@/features/admin/monitoring/components/CandidateResultModal';
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
  Calendar,
  Download,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SectionBreakdownItem {
  category?: string;
  sectionCode?: string;
  sectionName?: string;
  correctCount?: number;
  score?: number;
  requiredMin?: number;
  passed?: boolean;
}

export interface AdminTestAttemptItem {
  id: string;
  candidateName: string;
  email?: string;
  role?: string;
  assessment: string;
  assessmentId?: string;
  score: number;
  percentage?: number;
  sectionsBreakdown?: SectionBreakdownItem[];
  foundationScore?: number;
  advancedScore?: number;
  codingSolved?: number;
  qualification?: string;
  qualificationReason?: string;
  hasEvaluation?: boolean;
  status: string;
  submittedAt: string;
}

/** Formats a timestamp into Indian Standard Time (IST) */
export function formatIndianTime(isoString?: string | Date): string {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    const dateStr = d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    return `${dateStr}, ${timeStr} IST`;
  } catch {
    return String(isoString);
  }
}

/** Formats section-wise scores into a readable breakdown */
export function formatSectionWise(item: AdminTestAttemptItem): string {
  if (item.sectionsBreakdown && Array.isArray(item.sectionsBreakdown) && item.sectionsBreakdown.length > 0) {
    return item.sectionsBreakdown
      .map((s) => {
        const name = s.sectionName || s.sectionCode || 'Section';
        if (typeof s.correctCount === 'number') {
          return `${name}: ${s.correctCount}`;
        }
        if (typeof s.score === 'number') {
          return `${name}: ${s.score}`;
        }
        return name;
      })
      .join(' | ');
  }

  const parts: string[] = [];
  if (typeof item.foundationScore === 'number' && item.foundationScore > 0) {
    parts.push(`Foundation: ${item.foundationScore}`);
  }
  if (typeof item.advancedScore === 'number' && item.advancedScore > 0) {
    parts.push(`Advanced: ${item.advancedScore}`);
  }
  if (typeof item.codingSolved === 'number' && item.codingSolved > 0) {
    parts.push(`Coding: ${item.codingSolved}`);
  }

  return parts.length > 0 ? parts.join(' | ') : 'General';
}

/** Checks whether a timestamp falls within the selected date horizon (evaluated in IST) */
export function isWithinDateFilter(
  submittedAtIso: string,
  filter: 'today' | 'yesterday' | 'custom' | 'all',
  startDate?: string,
  endDate?: string,
): boolean {
  if (filter === 'all') return true;
  const timeMs = new Date(submittedAtIso).getTime();
  if (isNaN(timeMs)) return false;

  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = istFormatter.format(now);

  if (filter === 'today') {
    const startMs = new Date(`${todayStr}T00:00:00+05:30`).getTime();
    const endMs = new Date(`${todayStr}T23:59:59.999+05:30`).getTime();
    return timeMs >= startMs && timeMs <= endMs;
  }

  if (filter === 'yesterday') {
    const todayDate = new Date(`${todayStr}T12:00:00+05:30`);
    todayDate.setDate(todayDate.getDate() - 1);
    const yesterdayStr = istFormatter.format(todayDate);
    const startMs = new Date(`${yesterdayStr}T00:00:00+05:30`).getTime();
    const endMs = new Date(`${yesterdayStr}T23:59:59.999+05:30`).getTime();
    return timeMs >= startMs && timeMs <= endMs;
  }

  if (filter === 'custom') {
    if (startDate) {
      const startMs = new Date(`${startDate}T00:00:00+05:30`).getTime();
      if (timeMs < startMs) return false;
    }
    if (endDate) {
      const endMs = new Date(`${endDate}T23:59:59.999+05:30`).getTime();
      if (timeMs > endMs) return false;
    }
    return true;
  }

  return true;
}

/** Exports candidate attempts to CSV in the exact requested format */
export function exportResultsToCsv(
  items: AdminTestAttemptItem[],
  filenamePrefix = 'Candidate_Results',
) {
  if (items.length === 0) {
    toast.error('No candidate attempts available to export.');
    return;
  }

  const headers = [
    '#',
    'Candidate Name',
    'Email',
    'Score',
    '%',
    'section wise',
    'Status',
    'Submitted Time indian',
  ];

  const escapeCsv = (val: unknown): string => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = items.map((item, idx) => {
    const rowNum = idx + 1;
    const name = item.candidateName || 'Unknown Candidate';
    const email = item.email || '';
    const score = item.score !== undefined ? item.score : 0;
    const percentage =
      item.percentage !== undefined
        ? `${item.percentage}%`
        : item.score <= 100
          ? `${Math.round(item.score)}%`
          : 'N/A';
    const sectionWise = formatSectionWise(item);
    const status = item.qualification ? `${item.status} (${item.qualification})` : item.status || 'COMPLETED';
    const indianTime = formatIndianTime(item.submittedAt);

    return [
      rowNum,
      escapeCsv(name),
      escapeCsv(email),
      score,
      escapeCsv(percentage),
      escapeCsv(sectionWise),
      escapeCsv(status),
      escapeCsv(indianTime),
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateTag = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `${filenamePrefix}_${dateTag}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success(`Successfully exported ${items.length} candidate result(s) to CSV!`);
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

      const isCandidateOnly = (role?: string, email?: string) => {
        if (role) {
          const r = role.toUpperCase();
          if (r !== 'CANDIDATE') return false;
        }
        if (email && email.toLowerCase().includes('admin@intervu.ai')) {
          return false;
        }
        return true;
      };

      // Populate from recent test attempts endpoint
      if (recentRes.status === 'fulfilled' && recentRes.value?.data) {
        recentRes.value.data.forEach((item, idx) => {
          const role = item.role || item.user?.role;
          const email = item.email || item.user?.email;
          if (!isCandidateOnly(role, email)) {
            return;
          }
          const key = item.id || `recent-${idx}-${item.candidateName}`;
          const score = typeof item.score === 'number' ? Math.round(item.score * 100) / 100 : 0;
          const percentage =
            typeof item.percentage === 'number'
              ? Math.round(item.percentage)
              : score <= 100
                ? Math.round(score)
                : undefined;

          map.set(key, {
            id: item.id || key,
            candidateName: item.candidateName || 'Unknown Candidate',
            email: email || undefined,
            role: role || 'CANDIDATE',
            assessment: item.assessment || 'General Assessment',
            assessmentId: item.assessmentId || undefined,
            score,
            percentage,
            sectionsBreakdown: item.sectionsBreakdown || [],
            foundationScore: item.foundationScore,
            advancedScore: item.advancedScore,
            codingSolved: item.codingSolved,
            qualification: item.qualification,
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
          const candidateRole = rep.candidate?.role || rep.role;
          const candidateEmail = rep.candidate?.email || rep.email;
          if (!isCandidateOnly(candidateRole, candidateEmail)) {
            map.delete(rep.id);
            return;
          }
          const existing = map.get(rep.id);
          const sectionsBreakdown = rep.sectionsBreakdown || existing?.sectionsBreakdown || [];
          const score = typeof rep.score === 'number' ? Math.round(rep.score * 100) / 100 : existing?.score || 0;
          const percentage =
            typeof rep.percentage === 'number'
              ? Math.round(rep.percentage)
              : existing?.percentage ??
                (score <= 100 ? Math.round(score) : undefined);

          if (existing) {
            existing.email = existing.email || candidateEmail;
            existing.role = existing.role || candidateRole;
            existing.hasEvaluation = true;
            existing.score = score;
            existing.percentage = percentage;
            existing.sectionsBreakdown = sectionsBreakdown;
            existing.foundationScore = rep.foundationScore ?? existing.foundationScore;
            existing.advancedScore = rep.advancedScore ?? existing.advancedScore;
            existing.codingSolved = rep.codingSolved ?? existing.codingSolved;
            existing.qualification = rep.qualification ?? existing.qualification;
            existing.qualificationReason = rep.qualificationReason ?? existing.qualificationReason;
            existing.status = rep.status || existing.status;
            existing.assessmentId = rep.assessment?.id || existing.assessmentId;
          } else {
            map.set(rep.id, {
              id: rep.id,
              candidateName: rep.candidate?.fullName || 'Unknown Candidate',
              email: candidateEmail,
              role: candidateRole || 'CANDIDATE',
              assessment: rep.assessment?.displayName || 'Assessment Evaluation',
              assessmentId: rep.assessment?.id,
              score,
              percentage,
              sectionsBreakdown,
              foundationScore: rep.foundationScore,
              advancedScore: rep.advancedScore,
              codingSolved: rep.codingSolved,
              qualification: rep.qualification,
              qualificationReason: rep.qualificationReason,
              hasEvaluation: true,
              status: rep.status || 'COMPLETED',
              submittedAt: rep.completedAt || new Date().toISOString(),
            });
          }
        });
      }

      return Array.from(map.values())
        .filter((item) => isCandidateOnly(item.role, item.email))
        .sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
        );
    },
    staleTime: 30_000,
  });
}

export default function AdminRecentTestAttemptsPage() {
  const { data: attempts, isLoading, isError, refetch, isFetching } = useAllAdminTestAttempts();

  // Filters state
  const [selectedAssessment, setSelectedAssessment] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'custom' | 'all'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Multi-selection state for CSV export
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Result popup modal state
  const [modalCandidate, setModalCandidate] = useState<{
    attemptId: string;
    candidateName: string;
    candidateEmail: string;
    status: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (row: AdminTestAttemptItem) => {
    setModalCandidate({
      attemptId: row.id,
      candidateName: row.candidateName,
      candidateEmail: row.email || '',
      status: row.status,
    });
    setIsModalOpen(true);
  };

  // Distinct assessments list for dropdown filter
  const assessmentList = useMemo(() => {
    if (!attempts) return [];
    const map = new Map<string, { id: string; name: string; count: number }>();
    attempts.forEach((a) => {
      const name = a.assessment || 'General Assessment';
      const id = a.assessmentId || name;
      const existing = map.get(name);
      if (existing) {
        existing.count++;
      } else {
        map.set(name, { id, name, count: 1 });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [attempts]);

  // Filtered attempts based on assessment, date horizon, status, and search
  const filteredAttempts = useMemo(() => {
    if (!attempts) return [];
    return attempts.filter((item) => {
      // 1. Assessment filter
      if (selectedAssessment !== 'all' && item.assessment !== selectedAssessment) {
        return false;
      }

      // 2. Date horizon filter (IST)
      if (!isWithinDateFilter(item.submittedAt, dateFilter, startDate, endDate)) {
        return false;
      }

      // 3. Status filter
      if (statusFilter !== 'all' && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.candidateName.toLowerCase().includes(q);
        const matchesEmail = Boolean(item.email && item.email.toLowerCase().includes(q));
        const matchesAssessment = item.assessment.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesAssessment) {
          return false;
        }
      }

      return true;
    });
  }, [attempts, selectedAssessment, dateFilter, startDate, endDate, statusFilter, searchQuery]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAttempts.length && filteredAttempts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAttempts.map((a) => a.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // CSV Export handlers
  const handleExportSelected = () => {
    const selectedItems = filteredAttempts.filter((a) => selectedIds.has(a.id));
    const prefix =
      selectedAssessment !== 'all'
        ? `Results_${selectedAssessment.replace(/[^a-zA-Z0-9]/g, '_')}`
        : 'Candidate_Results_Selected';
    exportResultsToCsv(selectedItems, prefix);
  };

  const handleExportAll = () => {
    const prefix =
      selectedAssessment !== 'all'
        ? `Results_${selectedAssessment.replace(/[^a-zA-Z0-9]/g, '_')}`
        : 'Candidate_Results_Filtered';
    exportResultsToCsv(filteredAttempts, prefix);
  };

  // Dynamic KPI Stats based on current filtered horizon
  const stats = useMemo(() => {
    if (!filteredAttempts || filteredAttempts.length === 0) {
      return { total: 0, avgScore: 0, completed: 0, highPerformers: 0 };
    }
    const completed = filteredAttempts.filter(
      (a) => a.status.toUpperCase() === 'COMPLETED' || a.status.toUpperCase() === 'SUBMITTED',
    ).length;
    const highPerformers = filteredAttempts.filter((a) => (a.percentage ?? a.score) >= 80).length;

    const evaluatedAttempts = filteredAttempts.filter((a) => a.hasEvaluation || (a.score && a.score > 0));
    const totalScore = evaluatedAttempts.reduce(
      (acc, curr) => acc + (curr.percentage ?? (curr.score || 0)),
      0,
    );
    const avgScore =
      evaluatedAttempts.length > 0
        ? Math.round((totalScore / evaluatedAttempts.length) * 10) / 10
        : 0;

    return { total: filteredAttempts.length, avgScore, completed, highPerformers };
  }, [filteredAttempts]);

  // Table columns definition matching required fields
  const columns: ColumnDef<AdminTestAttemptItem>[] = useMemo(
    () => [
      {
        id: 'select',
        header: (
          <div className='flex items-center gap-2 pl-2'>
            <Checkbox
              checked={
                filteredAttempts.length > 0 && selectedIds.size === filteredAttempts.length
              }
              onCheckedChange={toggleSelectAll}
              aria-label='Select all'
            />
            <span className='text-xs font-semibold'>#</span>
          </div>
        ),
        className: 'w-[75px]',
        cell: (row, idx) => (
          <div className='flex items-center gap-2.5 pl-2'>
            <Checkbox
              checked={selectedIds.has(row.id)}
              onCheckedChange={() => toggleSelectOne(row.id)}
              aria-label={`Select ${row.candidateName}`}
            />
            <span className='font-mono text-xs text-muted-foreground'>{idx + 1}</span>
          </div>
        ),
      },
      {
        id: 'candidate',
        header: 'Candidate Name & Email',
        cell: (row) => (
          <div className='flex flex-col min-w-[170px]'>
            <span className='font-semibold text-foreground text-sm'>{row.candidateName}</span>
            {row.email ? (
              <span className='text-xs text-muted-foreground'>{row.email}</span>
            ) : (
              <span className='text-xs text-muted-foreground/60 italic'>No email documented</span>
            )}
          </div>
        ),
      },
      {
        id: 'assessment',
        header: 'Assessment',
        cell: (row) => (
          <div className='flex flex-col max-w-[200px]'>
            <span className='font-medium text-foreground/90 text-sm truncate' title={row.assessment}>
              {row.assessment}
            </span>
          </div>
        ),
      },
      {
        id: 'score',
        header: 'Score / %',
        cell: (row) => {
          const pct = row.percentage ?? (row.score <= 100 ? Math.round(row.score) : null);
          let colorClass =
            'text-orange-700 bg-orange-100 dark:bg-orange-950/60 dark:text-orange-400 border-orange-200 dark:border-orange-800';
          if ((pct ?? row.score) >= 80) {
            colorClass =
              'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
          } else if ((pct ?? row.score) >= 60) {
            colorClass =
              'text-blue-700 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800';
          }

          return (
            <div className='flex items-center gap-1.5'>
              <span className={cn('px-2.5 py-0.5 rounded-md text-xs font-bold border', colorClass)}>
                {pct !== null ? `${pct}%` : `${row.score} pts`}
              </span>
              {pct !== null && row.score !== pct && (
                <span className='text-[11px] text-muted-foreground font-mono'>
                  ({row.score} pts)
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'sectionsBreakdown',
        header: 'Section Wise',
        cell: (row) => {
          const formatted = formatSectionWise(row);
          if (row.sectionsBreakdown && row.sectionsBreakdown.length > 0) {
            return (
              <div className='flex flex-wrap gap-1 max-w-[250px]'>
                {row.sectionsBreakdown.map((sec, i) => (
                  <Badge key={i} variant='secondary' className='text-[10px] px-1.5 py-0.5 font-normal'>
                    <span className='font-medium mr-1'>{sec.sectionName || sec.sectionCode}:</span>
                    <span className='font-bold text-foreground'>{sec.correctCount ?? sec.score ?? '-'}</span>
                  </Badge>
                ))}
              </div>
            );
          }
          return (
            <span className='text-xs text-muted-foreground max-w-[200px] truncate block' title={formatted}>
              {formatted}
            </span>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => (
          <div className='flex flex-col gap-1'>
            <Badge
              variant='outline'
              className={cn(
                'text-[10px] uppercase font-semibold tracking-wider w-fit',
                row.status === 'COMPLETED' || row.status === 'SUBMITTED'
                  ? 'border-emerald-500/60 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                  : 'text-muted-foreground',
              )}
            >
              {row.status}
            </Badge>
            {row.qualification && row.qualification !== 'NOT_SPECIFIED' && (
              <span className='text-[10px] font-bold text-primary'>
                {row.qualification}
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'submittedAt',
        header: 'Submitted Time (Indian IST)',
        cell: (row) => (
          <div className='flex flex-col text-xs text-muted-foreground min-w-[155px]'>
            <span className='font-medium text-foreground/90'>{formatIndianTime(row.submittedAt)}</span>
          </div>
        ),
      },
      {
        id: 'actions',
        header: <div className='text-right pr-2'>Actions</div>,
        className: 'text-right',
        cell: (row) => (
          <div className='flex justify-end items-center pr-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => handleOpenModal(row)}
              className='gap-1.5 h-7 px-2.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10 hover:text-primary transition-colors shadow-2xs'
              title='View Candidate Result in Popup Modal'
            >
              <Eye className='size-3.5' />
              <span>View Result</span>
            </Button>
          </div>
        ),
      },
    ],
    [filteredAttempts, selectedIds],
  );

  return (
    <div className='space-y-6 container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl animate-fade-in-up pb-12'>
      <SectionHeader
        title='Recent Test Attempts'
        description='Monitor candidate testing execution, filter outcomes by assessment and date, inspect diagnostic scorecards in popups, and export comprehensive CSV result logs.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Test Attempts' }]}
        actions={
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => refetch()}
              disabled={isFetching}
              className='gap-2 shadow-2xs'
            >
              <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* KPI Stats Grid */}
      <div className='grid gap-4 sm:grid-cols-4'>
        <StatCard
          title='Total Attempts'
          value={stats.total.toString()}
          icon={<BarChart3 className='size-5 text-indigo-500' />}
          description='Matching current filters'
        />
        <StatCard
          title='Average Score'
          value={`${stats.avgScore}%`}
          icon={<TrendingUp className='size-5 text-blue-500' />}
          description='Cohort evaluation mean'
        />
        <StatCard
          title='Completed'
          value={stats.completed.toString()}
          icon={<UserCheck className='size-5 text-emerald-500' />}
          description='Evaluations finalized & graded'
        />
        <StatCard
          title='Top Performers (≥80%)'
          value={stats.highPerformers.toString()}
          icon={<Award className='size-5 text-amber-500' />}
          description='Exceeding excellence benchmark'
        />
      </div>

      {/* Filter and Control Ribbon Card */}
      <Card className='rounded-xl shadow-xs border border-border p-4 bg-card space-y-3.5'>
        {/* Row 1: Assessment Selector & Date Horizon */}
        <div className='flex flex-wrap items-center justify-between gap-3'>
          {/* Assessment Filter Selector */}
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider shrink-0'>
              <Layers className='size-4 text-primary' />
              <span>Assessment:</span>
            </div>
            <select
              value={selectedAssessment}
              onChange={(e) => {
                setSelectedAssessment(e.target.value);
                setSelectedIds(new Set());
              }}
              className='h-8 text-xs rounded-lg border border-input bg-background px-3 font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-sm'
            >
              <option value='all'>All Assessments ({attempts?.length || 0} attempts)</option>
              {assessmentList.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name} ({a.count} attempt{a.count !== 1 ? 's' : ''})
                </option>
              ))}
            </select>
          </div>

          {/* Time Horizon Button Group */}
          <div className='flex flex-wrap items-center gap-2'>
            <div className='flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider'>
              <Calendar className='size-4 text-primary' />
              <span>Horizon:</span>
            </div>
            <div className='inline-flex rounded-md border bg-muted/40 p-0.5 text-xs'>
              <Button
                variant={dateFilter === 'today' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => {
                  setDateFilter('today');
                  setSelectedIds(new Set());
                }}
                className='h-7 px-3 text-xs rounded-sm'
              >
                Today
              </Button>
              <Button
                variant={dateFilter === 'yesterday' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => {
                  setDateFilter('yesterday');
                  setSelectedIds(new Set());
                }}
                className='h-7 px-3 text-xs rounded-sm'
              >
                Yesterday
              </Button>
              <Button
                variant={dateFilter === 'custom' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => {
                  setDateFilter('custom');
                  setSelectedIds(new Set());
                }}
                className='h-7 px-3 text-xs rounded-sm'
              >
                Custom Date
              </Button>
              <Button
                variant={dateFilter === 'all' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => {
                  setDateFilter('all');
                  setSelectedIds(new Set());
                }}
                className='h-7 px-3 text-xs rounded-sm'
              >
                All Time
              </Button>
            </div>
          </div>
        </div>

        {/* Row 2 (Conditional): Custom Date Pickers */}
        {dateFilter === 'custom' && (
          <div className='flex flex-wrap items-center gap-3 pt-2.5 border-t border-border/60 animate-in fade-in duration-200'>
            <span className='text-xs font-medium text-muted-foreground'>Custom Range (Indian Time):</span>
            <div className='flex items-center gap-1.5'>
              <span className='text-xs text-muted-foreground'>From:</span>
              <Input
                type='date'
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedIds(new Set());
                }}
                className='h-7 w-36 text-xs px-2'
              />
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='text-xs text-muted-foreground'>To:</span>
              <Input
                type='date'
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedIds(new Set());
                }}
                className='h-7 w-36 text-xs px-2'
              />
            </div>
          </div>
        )}

        {/* Row 3: Search Box, Status Filter, and CSV Export Actions */}
        <div className='flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-border/60'>
          <div className='flex flex-wrap items-center gap-3 flex-1'>
            {/* Search */}
            <div className='relative flex-1 sm:max-w-xs'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
              <input
                type='text'
                placeholder='Search candidate name, email, exam...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground font-medium'
              />
            </div>

            {/* Status Filter */}
            <div className='flex items-center gap-2 border border-input rounded-lg px-2.5 py-1.5 bg-background'>
              <Filter className='size-3.5 text-muted-foreground' />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className='bg-transparent text-xs text-foreground focus:outline-none font-medium'
              >
                <option value='all'>All Statuses</option>
                <option value='completed'>Completed</option>
                <option value='submitted'>Submitted</option>
                <option value='in_progress'>In Progress</option>
              </select>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className='flex items-center gap-2'>
            {selectedIds.size > 0 && (
              <Button
                variant='default'
                size='sm'
                onClick={handleExportSelected}
                className='gap-1.5 text-xs h-8 font-semibold shadow-xs'
              >
                <Download className='size-3.5' />
                Export Selected ({selectedIds.size}) to CSV
              </Button>
            )}

            <Button
              variant={selectedIds.size > 0 ? 'outline' : 'default'}
              size='sm'
              onClick={handleExportAll}
              disabled={filteredAttempts.length === 0}
              className='gap-1.5 text-xs h-8 font-semibold shadow-xs'
              title='Export all filtered attempts to CSV'
            >
              <Download className='size-3.5' />
              Export All Filtered ({filteredAttempts.length}) to CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Attempts Data Table Card */}
      <Card className='rounded-xl shadow-sm border border-border'>
        <CardHeader className='p-4 border-b bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2'>
          <div>
            <CardTitle className='text-sm font-semibold text-foreground flex items-center gap-2'>
              <Clock className='size-4 text-primary' />
              <span>
                {selectedAssessment !== 'all' ? selectedAssessment : 'All Assessments'} — Test Attempts Log
              </span>
              <Badge variant='outline' className='text-[10px] font-mono ml-1.5'>
                {filteredAttempts.length} item{filteredAttempts.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            <CardDescription className='text-xs text-muted-foreground mt-0.5'>
              Select multiple candidates using checkboxes to export custom batches, or view individual candidate diagnostics in a popup modal.
            </CardDescription>
          </div>
          {selectedIds.size > 0 && (
            <div className='flex items-center gap-2 text-xs'>
              <span className='font-medium text-foreground'>{selectedIds.size} candidate(s) selected</span>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setSelectedIds(new Set())}
                className='h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground'
              >
                Clear selection
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className='p-0'>
          {isError ? (
            <div className='py-12'>
              <EmptyState
                variant='error'
                title='Failed to load test attempts'
                description='A server error occurred while retrieving candidate test submissions.'
                actionLabel='Retry Fetch'
                onAction={refetch}
              />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredAttempts}
              isLoading={isLoading}
              rowKey={(row) => row.id}
              hideSrNo={true}
              containerClassName='border-0 rounded-none'
              emptyState={
                <div className='py-16'>
                  <EmptyState
                    variant='no-data'
                    title='No Matching Test Attempts'
                    description='No test attempts were found matching the selected assessment or date horizon.'
                    actionLabel='Reset Filters'
                    onAction={() => {
                      setSelectedAssessment('all');
                      setDateFilter('all');
                      setSearchQuery('');
                      setStatusFilter('all');
                      setSelectedIds(new Set());
                    }}
                  />
                </div>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Candidate Result Popup Modal */}
      <CandidateResultModal
        candidate={modalCandidate}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalCandidate(null);
        }}
      />
    </div>
  );
}
