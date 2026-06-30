import React from 'react';
import { useWorkflowOverview } from '../hooks/useWorkflow';
import { Progress } from '@/components/ui/progress';
import { Loader2, Clock, Users, FileText, CheckCircle2, Layers, AlertCircle } from 'lucide-react';

interface OverviewPanelProps {
  examId: string;
  workflowStatus?: string;
  completionPercentage?: number;
}

const STATUS_COLORS: Record<string, string> = {
  CONFIGURATION:       'bg-slate-500',
  QUESTION_GENERATION: 'bg-violet-500',
  QUESTION_REVIEW:     'bg-amber-500',
  ASSEMBLY:            'bg-blue-500',
  PUBLISHING:          'bg-emerald-500',
  COMPLETED:           'bg-green-500',
};

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED:   'Completed',
  FAILED:      'Failed',
  BLOCKED:     'Blocked',
};

export const OverviewPanel: React.FC<OverviewPanelProps> = ({ examId }) => {
  const { overview, loading, error } = useWorkflowOverview(examId);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error || 'Could not load overview data'}
      </div>
    );
  }

  const { questionStats } = overview;
  const reviewProgress = questionStats.total > 0
    ? Math.round(((questionStats.approved + questionStats.rejected) / questionStats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Exam Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Exam Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-semibold text-right max-w-[60%]">{overview.examName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="text-sm font-medium">{overview.examRole || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Duration</span>
              <span className="text-sm font-medium">{overview.durationMinutes} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Questions</span>
              <span className="text-sm font-medium">{overview.totalQuestions} total</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> Sections</span>
              <span className="text-sm font-medium">{overview.sections?.length ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Workflow Status */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Workflow Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                overview.workflowStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                overview.workflowStatus === 'IN_PROGRESS' ? 'bg-violet-100 text-violet-700' :
                overview.workflowStatus === 'FAILED' ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-600'
              }`}>{STATUS_LABELS[overview.workflowStatus] ?? overview.workflowStatus}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Step</span>
              <span className="text-sm font-medium">{overview.currentStep?.replace(/_/g, ' ')}</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Completion</span>
                <span className="font-semibold">{overview.completionPercentage}%</span>
              </div>
              <Progress value={overview.completionPercentage} className="h-2" />
            </div>
            {overview.publishedAt && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Published</span>
                <span className="text-sm font-medium">{new Date(overview.publishedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Question Stats */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Question Bank</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Generated', value: questionStats.total, color: 'border-slate-200 bg-slate-50 text-slate-700' },
            { label: 'Pending', value: questionStats.draft, color: 'border-amber-200 bg-amber-50 text-amber-700' },
            { label: 'Approved', value: questionStats.approved, color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
            { label: 'Rejected', value: questionStats.rejected, color: 'border-red-200 bg-red-50 text-red-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
              <p className="text-xs font-medium opacity-70">{s.label}</p>
              <p className="text-3xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {questionStats.total > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-muted-foreground shrink-0">Review progress</span>
            <Progress value={reviewProgress} className="flex-1 h-1.5 [&>div]:bg-violet-500" />
            <span className="text-xs font-semibold">{reviewProgress}%</span>
          </div>
        )}
      </div>

      {/* Sections */}
      {overview.sections?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Exam Sections</h3>
          <div className="rounded-xl border overflow-hidden divide-y">
            {overview.sections.map((section: any, i: number) => (
              <div key={section.id} className="px-4 py-3 flex items-center justify-between gap-4 bg-card hover:bg-muted/20 transition-colors">
                <div>
                  <p className="text-sm font-medium">{section.name}</p>
                  {section.topics?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Topics: {section.topics.slice(0, 4).join(', ')}{section.topics.length > 4 ? ' …' : ''}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full shrink-0">
                  {section.questionCount} Q
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
