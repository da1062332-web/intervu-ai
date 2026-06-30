import React, { useState } from 'react';
import { useWorkflowQuestions } from '../hooks/useWorkflow';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckSquare,
  XCircle,
  Search,
  Filter,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface ReviewPanelProps {
  examId: string;
  status: { status: string; progress: number; startedAt?: string | null };
  onReview: () => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HARD: 'bg-red-100 text-red-700',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export const ReviewPanel: React.FC<ReviewPanelProps> = ({ examId, status, onReview }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const {
    questions,
    total,
    loading,
    error,
    approveQuestion,
    rejectQuestion,
    bulkApprove,
    refetch,
  } = useWorkflowQuestions(examId);

  const filtered = questions.filter((q) => {
    const matchSearch =
      !search ||
      q.questionText.toLowerCase().includes(search.toLowerCase()) ||
      q.topic.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = questions.filter((q) => q.status === 'DRAFT').length;
  const approvedCount = questions.filter((q) => q.status === 'APPROVED').length;
  const rejectedCount = questions.filter((q) => q.status === 'REJECTED').length;
  const pendingIds = questions.filter((q) => q.status === 'DRAFT').map((q) => q.id);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h3 className='text-xl font-semibold'>Question Review Queue</h3>
          <p className='text-sm text-muted-foreground mt-1'>
            {total} questions generated — approve or reject each one before assembling the test.
          </p>
        </div>
        <div className='flex gap-2 flex-wrap'>
          <Button variant='outline' size='sm' onClick={() => refetch(1, 100)} className='gap-1.5'>
            <RefreshCw className='w-3.5 h-3.5' />
            Refresh
          </Button>
          <Button
            variant='outline'
            size='sm'
            disabled={pendingIds.length === 0 || loading}
            onClick={() => bulkApprove(pendingIds)}
            className='gap-1.5'
          >
            <CheckSquare className='w-3.5 h-3.5' />
            Approve All Pending ({pendingIds.length})
          </Button>
          <Button size='sm' disabled={approvedCount === 0} onClick={onReview} className='gap-1.5'>
            <CheckCircle className='w-3.5 h-3.5' />
            Submit Review
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        {[
          { label: 'Total', value: total, color: 'bg-slate-50  border-slate-200  text-slate-700' },
          {
            label: 'Pending',
            value: pendingCount,
            color: 'bg-amber-50  border-amber-200  text-amber-700',
          },
          {
            label: 'Approved',
            value: approvedCount,
            color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          },
          {
            label: 'Rejected',
            value: rejectedCount,
            color: 'bg-red-50    border-red-200    text-red-700',
          },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 flex flex-col gap-1 ${s.color}`}>
            <span className='text-xs font-medium opacity-70'>{s.label}</span>
            <span className='text-2xl font-bold'>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className='flex items-center gap-3 p-3 bg-muted/30 rounded-lg border text-sm'>
        <span className='text-muted-foreground font-medium shrink-0'>Review Progress</span>
        <Progress
          value={total > 0 ? Math.round(((approvedCount + rejectedCount) / total) * 100) : 0}
          className='flex-1 h-2'
        />
        <span className='font-semibold tabular-nums shrink-0'>
          {total > 0 ? Math.round(((approvedCount + rejectedCount) / total) * 100) : 0}%
        </span>
      </div>

      {/* Filters */}
      <div className='flex gap-3 flex-wrap'>
        <div className='relative flex-1 min-w-[200px]'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground' />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search questions or topics…'
            className='w-full pl-8 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30'
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className='px-3 py-2 text-sm border rounded-md bg-background'
        >
          <option value=''>All Statuses</option>
          <option value='DRAFT'>Pending</option>
          <option value='APPROVED'>Approved</option>
          <option value='REJECTED'>Rejected</option>
        </select>
      </div>

      {/* Question List */}
      {loading ? (
        <div className='flex items-center justify-center h-40'>
          <Loader2 className='h-6 w-6 animate-spin text-primary' />
        </div>
      ) : error ? (
        <div className='p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2'>
          <AlertCircle className='h-4 w-4 shrink-0' />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className='text-center py-12 border-2 border-dashed rounded-xl'>
          <p className='text-muted-foreground text-sm'>
            {total === 0
              ? 'No questions generated yet. Run Question Generation first.'
              : 'No questions match the current filter.'}
          </p>
        </div>
      ) : (
        <div className='rounded-xl border overflow-hidden divide-y'>
          {filtered.map((q) => (
            <div key={q.id} className='bg-card hover:bg-muted/20 transition-colors'>
              {/* Question row */}
              <div className='px-4 py-3 flex items-start gap-3'>
                {/* Status dot */}
                <div
                  className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                    q.status === 'APPROVED'
                      ? 'bg-emerald-500'
                      : q.status === 'REJECTED'
                        ? 'bg-red-500'
                        : 'bg-amber-400'
                  }`}
                />

                {/* Content */}
                <div className='flex-1 min-w-0'>
                  <p
                    className='text-sm font-medium leading-snug cursor-pointer hover:text-primary transition-colors'
                    onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                  >
                    {q.questionText}
                  </p>
                  <div className='flex flex-wrap gap-2 mt-1.5 items-center text-xs text-muted-foreground'>
                    <span className='font-medium text-foreground/70'>{q.topic}</span>
                    <span>·</span>
                    <span>{q.section}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-medium ${DIFFICULTY_COLORS[q.difficulty] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {q.difficulty}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[q.status] ?? ''}`}
                    >
                      {q.status}
                    </span>
                  </div>

                  {/* Expanded answer */}
                  {expanded === q.id && (
                    <div className='mt-3 space-y-2 text-sm bg-muted/40 rounded-lg p-3 border'>
                      <div>
                        <span className='font-semibold text-xs uppercase tracking-wide text-muted-foreground'>
                          Answer
                        </span>
                        <p className='mt-0.5 text-foreground'>{q.answer}</p>
                      </div>
                      {q.explanation && (
                        <div>
                          <span className='font-semibold text-xs uppercase tracking-wide text-muted-foreground'>
                            Explanation
                          </span>
                          <p className='mt-0.5 text-muted-foreground'>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className='flex gap-1.5 shrink-0'>
                  {q.status !== 'APPROVED' && (
                    <Button
                      size='sm'
                      variant='outline'
                      className='h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1'
                      onClick={() => approveQuestion(q.id)}
                    >
                      <CheckCircle className='w-3 h-3' />
                      Approve
                    </Button>
                  )}
                  {q.status !== 'REJECTED' && (
                    <Button
                      size='sm'
                      variant='outline'
                      className='h-7 text-xs text-red-600 border-red-200 hover:bg-red-50 gap-1'
                      onClick={() => rejectQuestion(q.id)}
                    >
                      <XCircle className='w-3 h-3' />
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
