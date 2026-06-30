import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkflows } from '../hooks/useWorkflow';
import { WORKFLOW_STATUS_COLORS, WORKFLOW_STEP_LABELS } from '../constants';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, Clock, CheckCircle2, AlertCircle, RefreshCw,
  Zap, AlertTriangle, ArrowRight, Search, SlidersHorizontal,
} from 'lucide-react';
import { WorkflowStatus, WorkflowStep } from '../types';
import { AdminInsights } from './AdminInsights';

// Step accent colours (left border)
const STEP_ACCENT: Record<string, string> = {
  CONFIGURATION:      'border-l-slate-400',
  QUESTION_GENERATION:'border-l-violet-500',
  QUESTION_REVIEW:    'border-l-amber-500',
  ASSEMBLY:           'border-l-blue-500',
  PUBLISHING:         'border-l-emerald-500',
  COMPLETED:          'border-l-green-500',
};

// Status pill colours
const STATUS_PILL: Record<string, string> = {
  NOT_STARTED: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  IN_PROGRESS: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
  COMPLETED:   'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  FAILED:      'bg-red-100 text-red-700 ring-1 ring-red-200',
  BLOCKED:     'bg-orange-100 text-orange-700 ring-1 ring-orange-200',
};

// Progress bar colour
const PROGRESS_COLOR: Record<string, string> = {
  NOT_STARTED: '[&>div]:bg-slate-400',
  IN_PROGRESS: '[&>div]:bg-violet-500',
  COMPLETED:   '[&>div]:bg-emerald-500',
  FAILED:      '[&>div]:bg-red-500',
  BLOCKED:     '[&>div]:bg-orange-500',
};

function StatusIcon({ status }: { status: string }) {
  if (status === WorkflowStatus.COMPLETED) return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === WorkflowStatus.FAILED) return <AlertTriangle className="h-3.5 w-3.5" />;
  if (status === WorkflowStatus.IN_PROGRESS) return <Zap className="h-3.5 w-3.5" />;
  return null;
}

export const WorkflowDashboard: React.FC = () => {
  const router = useRouter();
  const { workflows, loading, error, fetchWorkflows } = useWorkflows();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stepFilter, setStepFilter] = useState('');

  useEffect(() => {
    fetchWorkflows(1, 10, statusFilter || undefined);
  }, [fetchWorkflows, statusFilter]);

  if (loading && workflows.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center" role="status">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading workflows…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-5 text-red-800">
        <div className="flex items-center gap-2 font-medium">
          <AlertCircle className="h-5 w-5 text-red-500" />
          Error loading workflows
        </div>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch =
      w.examName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.examId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStep = stepFilter ? w.currentStep === stepFilter : true;
    return matchesSearch && matchesStep;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Exam Workflows</h2>
        <Button
          onClick={() => fetchWorkflows(1, 10, statusFilter || undefined)}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Admin Insight Cards */}
      <AdminInsights />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-muted/30 p-4 rounded-xl border">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or ID…"
            className="w-full pl-9 pr-4 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Dropdowns */}
        <div className="flex gap-3">
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <select
              className="pl-8 pr-3 py-2 border rounded-md text-sm bg-background appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          <select
            className="px-3 py-2 border rounded-md text-sm bg-background appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={stepFilter}
            onChange={(e) => setStepFilter(e.target.value)}
          >
            <option value="">All Steps</option>
            {Object.entries(WORKFLOW_STEP_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Workflow Cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filteredWorkflows.map((workflow) => {
          const isCompleted = workflow.workflowStatus === WorkflowStatus.COMPLETED;
          const isFailed    = workflow.workflowStatus === WorkflowStatus.FAILED;
          const accentClass = STEP_ACCENT[workflow.currentStep] ?? 'border-l-slate-400';
          const pillClass   = STATUS_PILL[workflow.workflowStatus] ?? 'bg-slate-100 text-slate-600';
          const progressCls = PROGRESS_COLOR[workflow.workflowStatus] ?? '';

          return (
            <div
              key={workflow.id}
              className={`group relative flex flex-col rounded-xl border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-l-4 overflow-hidden ${accentClass}`}
            >
              {/* Card top */}
              <div className="p-5 pb-3 flex flex-col gap-3">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3
                      className="font-semibold text-base leading-tight truncate"
                      title={workflow.examName}
                    >
                      {workflow.examName}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">
                      {workflow.examId}
                    </p>
                  </div>
                  {/* Status pill */}
                  <span className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${pillClass}`}>
                    <StatusIcon status={workflow.workflowStatus} />
                    {workflow.workflowStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Step + Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Current Step</span>
                    <span className="font-semibold text-foreground">
                      {WORKFLOW_STEP_LABELS[workflow.currentStep] ?? workflow.currentStep}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={workflow.completionPercentage}
                      className={`flex-1 h-2 ${progressCls}`}
                    />
                    <span className="text-xs font-bold tabular-nums w-8 text-right">
                      {workflow.completionPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t mx-5" />

              {/* Card footer */}
              <div className="px-5 py-3 flex items-center justify-between gap-3">
                {/* Date */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  {new Date(workflow.lastUpdated).toLocaleDateString()}
                </div>

                {/* Action button — single, context-aware */}
                {isCompleted ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1.5 shrink-0"
                    onClick={() => router.push(`/admin/workflows/${workflow.examId}`)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    View Details
                  </Button>
                ) : isFailed ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-red-600 border-red-200 hover:bg-red-50 gap-1.5 shrink-0"
                    onClick={() => router.push(`/admin/workflows/${workflow.examId}`)}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Retry
                  </Button>
                ) : workflow.pendingAction ? (
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 shrink-0"
                    onClick={() => router.push(`/admin/workflows/${workflow.examId}`)}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    {workflow.pendingAction.label}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 shrink-0"
                    onClick={() => router.push(`/admin/workflows/${workflow.examId}`)}
                  >
                    Open
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {filteredWorkflows.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center border-2 border-dashed rounded-xl">
            <p className="text-muted-foreground text-sm">No workflows match the current filters.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => { setSearchTerm(''); setStatusFilter(''); setStepFilter(''); }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
