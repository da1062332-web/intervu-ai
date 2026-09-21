'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  User,
  Clock,
  Wifi,
  WifiOff,
  Activity,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  FileText,
  History,
  Network,
  Cpu,
  Send,
  Lock,
  Plus,
  Zap,
  Check,
  AlertCircle,
  Play,
  StopCircle,
} from 'lucide-react';
import { CandidateItem } from '../hooks/useLiveMonitoring';
import { apiClient } from '@/services/api/client';
import { toast } from 'sonner';

interface CandidateDetailDrawerProps {
  candidate: CandidateItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecovery: (candidate: CandidateItem) => void;
  onActionComplete?: () => void;
}

export function CandidateDetailDrawer({
  candidate,
  isOpen,
  onClose,
  onOpenRecovery,
  onActionComplete,
}: CandidateDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'adminActions'
    | 'timeline'
    | 'answers'
    | 'progress'
    | 'proctoring'
    | 'network'
    | 'errors'
    | 'submissions'
  >('overview');

  const [detailData, setDetailData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [extendingTime, setExtendingTime] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('10');
  const [timeReason, setTimeReason] = useState('Proctor granted time extension');
  // Must match the Prisma `SubmissionReason` enum exactly — sending a value
  // outside it (as this previously did) fails the write with a 500 the
  // instant an admin submits with anything but the one option that happened
  // to already match ("Time Expired").
  const [forceSubmitReason, setForceSubmitReason] = useState('ADMIN_ACTION');
  const [forceSubmitDetails, setForceSubmitDetails] = useState('');
  const [isForceSubmitting, setIsForceSubmitting] = useState(false);

  const isFetchingRef = useRef(false);

  const fetchDetail = async (isBackground = false) => {
    if (!candidate || isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isBackground) setLoading(true);
    try {
      const res = await apiClient.request<any>(
        `/admin/monitoring/assessments/${candidate.assessmentId}/candidate/${candidate.attemptId}`,
      );
      setDetailData(res);
    } catch (err) {
      if (!isBackground) {
        toast.error('Failed to load candidate telemetry');
      }
    } finally {
      if (!isBackground) setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (!candidate || !isOpen) return;
    fetchDetail(false);
    // Land admins directly on the actionable tab for a candidate who needs
    // attention, instead of requiring a click through from Overview —
    // this is also why the header no longer duplicates a "Launch Recovery
    // Center" shortcut that Admin Actions already provides.
    const needsAction = candidate.status === 'AUTO_SUBMITTED' || candidate.status === 'ADMIN_REVIEW';
    setActiveTab(needsAction ? 'adminActions' : 'overview');
  }, [candidate?.attemptId, isOpen]);

  // The header stats (status, latency, progress) come from `candidate`,
  // which the dashboard keeps synced to its SSE stream — but the deeper
  // tab data (timeline, answers, proctoring log, audit trail) only exists
  // in `detailData`, fetched once above. Poll it while the dialog is open
  // so Timeline/Answers/Proctoring/etc. don't sit frozen at whatever they
  // were when it was opened. Skipped for attempts that have already ended,
  // since that data can no longer change.
  useEffect(() => {
    if (!candidate || !isOpen) return;
    const isEnded = ['SUBMITTED', 'COMPLETED', 'TERMINATED'].includes(candidate.status);
    if (isEnded) return;

    const interval = setInterval(() => {
      fetchDetail(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [candidate?.attemptId, isOpen, candidate?.status]);

  if (!candidate) return null;

  const handleExtendTime = async (minutes: number, reasonText?: string) => {
    setExtendingTime(true);
    try {
      await apiClient.request(`/admin/monitoring/attempts/${candidate.attemptId}/extend-time`, {
        method: 'POST',
        body: {
          extraMinutes: minutes,
          reason: reasonText || `Added +${minutes}m by administrator`,
        },
      });
      toast.success(`Granted +${minutes}m to ${candidate.candidateName}`);
      fetchDetail();
      onActionComplete?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to extend time');
    } finally {
      setExtendingTime(false);
    }
  };

  const handleForceSubmit = async () => {
    if (!confirm(`Are you sure you want to force submit the attempt for ${candidate.candidateName}?`)) {
      return;
    }
    setIsForceSubmitting(true);
    try {
      await apiClient.request(`/admin/monitoring/attempts/${candidate.attemptId}/force-submit`, {
        method: 'POST',
        body: {
          source: 'ADMIN',
          reason: forceSubmitReason,
          reasonDetails: forceSubmitDetails || 'Forced submission by admin proctor',
        },
      });
      toast.success('Attempt force-submitted successfully');
      fetchDetail();
      onActionComplete?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to force submit');
    } finally {
      setIsForceSubmitting(false);
    }
  };

  const isAutoSubmitted =
    candidate.status === 'AUTO_SUBMITTED' || candidate.status === 'ADMIN_REVIEW';
  const isDone = ['SUBMITTED', 'COMPLETED', 'TERMINATED'].includes(candidate.status);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'adminActions', label: 'Admin Actions', icon: Lock, highlight: !isDone && candidate.isNeedsAttention },
    { id: 'timeline', label: 'Timeline', icon: History },
    { id: 'answers', label: 'Answers', icon: FileText },
    { id: 'progress', label: 'Progress', icon: Activity },
    { id: 'proctoring', label: 'Proctoring', icon: ShieldAlert },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'errors', label: 'Errors', icon: AlertTriangle },
    { id: 'submissions', label: 'Submissions', icon: Send },
  ];

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // "default" is an internal placeholder key, not something to show an admin.
  const sectionLabel = (key: string) => {
    if (!key || key === 'default') return 'General Section';
    return key.replace(/[-_]/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
  };

  // One consistent empty-state treatment instead of each tab styling its
  // own "nothing here" message slightly differently.
  const EmptyState = ({ children }: { children: React.ReactNode }) => (
    <div className='p-4 text-center text-xs text-muted-foreground border rounded-lg bg-muted/10'>
      {children}
    </div>
  );

  // One consistent section heading (muted icon + label) reused across every
  // detail tab, matching the Overview tab's panel headers.
  const TabHeading = ({
    icon: Icon,
    children,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
  }) => (
    <h4 className='font-semibold text-xs text-foreground flex items-center gap-1.5'>
      <Icon className='size-3.5 text-muted-foreground' />
      {children}
    </h4>
  );

  // Turns a camelCase/snake_case key into a readable label, e.g. "hiddenTimestamp" -> "Hidden Timestamp".
  const formatMetadataLabel = (key: string): string =>
    key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  // Formats a metadata value for display: ISO timestamps become locale strings,
  // "opt-N" answer keys become a 1-indexed "Option N" label since the raw
  // internal option id means nothing to an admin reading this log.
  const formatMetadataValue = (key: string, value: unknown): string => {
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return date.toLocaleString();
      }
      const optMatch = value.match(/^opt-(\d+)$/i);
      if (optMatch && /answer|option/i.test(key)) {
        return `Option ${parseInt(optMatch[1], 10) + 1}`;
      }
      return value;
    }
    if (typeof value === 'boolean' || typeof value === 'number') return String(value);
    return '';
  };

  // Raw event/audit-log metadata varies per event type, so it can't be
  // rendered as a fixed set of fields — shown as a readable key/value list
  // (recursing into nested objects) instead of a raw JSON dump.
  const MetadataBlock = ({ data }: { data: unknown }) => {
    if (!data || typeof data !== 'object') return null;

    const renderEntries = (obj: Record<string, unknown>, depth = 0) => (
      <div className={depth > 0 ? 'pl-3 border-l border-border/60 mt-1' : ''}>
        {Object.entries(obj).map(([key, value]) => (
          <div key={key} className='flex items-start gap-1.5 text-[11px] py-0.5'>
            <span className='text-muted-foreground shrink-0'>{formatMetadataLabel(key)}:</span>
            {value && typeof value === 'object' && !Array.isArray(value) ? (
              renderEntries(value as Record<string, unknown>, depth + 1)
            ) : (
              <span className='text-foreground break-all'>
                {Array.isArray(value) ? value.join(', ') : formatMetadataValue(key, value)}
              </span>
            )}
          </div>
        ))}
      </div>
    );

    return (
      <div className='bg-muted/40 p-2 rounded max-h-32 overflow-y-auto'>
        {renderEntries(data as Record<string, unknown>)}
      </div>
    );
  };

  // Coding answers are saved as a JSON string ({ code, language, runResponse, ... }),
  // not a plain option key — detect that shape so it can render as a code block
  // with test results instead of one raw escaped JSON line.
  const parseCodingAnswer = (answer: unknown): any | null => {
    try {
      const parsed = typeof answer === 'string' ? JSON.parse(answer) : answer;
      if (parsed && typeof parsed === 'object' && typeof parsed.code === 'string') {
        return parsed;
      }
    } catch {
      // Not a coding submission payload
    }
    return null;
  };

  const CodingAnswerBlock = ({ submission }: { submission: any }) => {
    const run = submission.runResponse;
    return (
      <div className='space-y-2'>
        <div className='flex items-center justify-between gap-2'>
          <Badge variant='outline' className='text-[10px] font-mono'>
            {submission.language || 'code'}
          </Badge>
          {run?.summary && (
            <span className='text-[10px] text-muted-foreground'>
              {run.summary.passed}/{run.summary.total} tests passed
            </span>
          )}
        </div>
        <pre className='text-[11px] bg-zinc-900 text-zinc-100 p-2.5 rounded font-mono whitespace-pre overflow-x-auto max-h-56'>
          {submission.code}
        </pre>
        {Array.isArray(run?.results) && run.results.length > 0 && (
          <div className='space-y-1'>
            {run.results.map((r: any) => (
              <div
                key={r.testIndex}
                className='flex items-start gap-1.5 text-[11px] p-1.5 rounded bg-muted/30'
              >
                {r.status === 'PASSED' ? (
                  <CheckCircle className='size-3.5 text-emerald-500 shrink-0 mt-0.5' />
                ) : (
                  <AlertCircle className='size-3.5 text-rose-500 shrink-0 mt-0.5' />
                )}
                <div className='min-w-0 flex-1'>
                  <span className='font-medium'>
                    Test {r.testIndex}: {r.status}
                  </span>
                  {r.status !== 'PASSED' && (
                    <p className='text-muted-foreground break-all'>
                      Input: {JSON.stringify(r.input)} • Expected:{' '}
                      {JSON.stringify(r.expectedOutput)} • Got: {String(r.actualOutput).trim()}
                      {r.error ? ` • Error: ${r.error}` : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };



  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className='sm:max-w-4xl flex flex-col p-0 bg-background'>
        {/* Header — one neutral badge style, color reserved for the status
            that actually needs it (needs-attention), so the header reads
            calmly instead of as a row of competing accent colors. */}
        <DialogHeader className='p-4 sm:p-5 border-b bg-muted/20 space-y-3'>
          <div className='flex items-start gap-3 pr-8'>
            <div className='size-11 rounded-full bg-muted text-foreground font-bold flex items-center justify-center text-base shrink-0'>
              {(candidate.candidateName || 'C').charAt(0).toUpperCase()}
            </div>
            <div className='min-w-0 space-y-1'>
              <DialogTitle className='text-base font-bold text-foreground truncate'>
                {candidate.candidateName || 'Candidate'}
              </DialogTitle>
              <div className='flex items-center gap-2 flex-wrap'>
                <Badge variant='outline' className='text-[10px] font-mono font-normal'>
                  {candidate.status}
                </Badge>
                {candidate.isNeedsAttention && (
                  <span className='inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400'>
                    <AlertCircle className='size-3' />
                    Needs attention
                  </span>
                )}
              </div>
              <DialogDescription className='text-xs text-muted-foreground truncate'>
                {candidate.candidateEmail} • <span className='font-mono'>ID: {candidate.attemptId}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Actions — the common actions live here, always visible
            regardless of which tab is open, instead of only inside Admin
            Actions. Force Submit still routes there rather than firing
            immediately: it's destructive and keeps its confirmation +
            reason picker as a deliberate second step. */}
        {!isDone && (
          <div className='flex flex-wrap items-center gap-2 px-4 sm:px-5 py-2.5 border-b bg-background'>
            <span className='text-[11px] font-medium text-muted-foreground'>Actions:</span>
            {!isAutoSubmitted && (
              <>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={extendingTime}
                  onClick={() => handleExtendTime(5)}
                  className='h-7 text-xs gap-1 px-2.5'
                >
                  <Plus className='size-3' />
                  5 min
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={extendingTime}
                  onClick={() => handleExtendTime(10)}
                  className='h-7 text-xs gap-1 px-2.5'
                >
                  <Plus className='size-3' />
                  10 min
                </Button>
              </>
            )}
            {isAutoSubmitted && (
              <Button
                size='sm'
                variant='destructive'
                onClick={() => {
                  onClose();
                  onOpenRecovery(candidate);
                }}
                className='h-7 text-xs gap-1.5 font-medium'
              >
                <RotateCcw className='size-3' />
                Recover attempt
              </Button>
            )}
            <Button
              size='sm'
              variant='ghost'
              onClick={() => setActiveTab('adminActions')}
              className='h-7 text-xs gap-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700'
            >
              <StopCircle className='size-3' />
              Force submit…
            </Button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className='flex items-center border-b bg-muted/10 px-3 overflow-x-auto text-xs no-scrollbar'>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-2.5 px-3 font-medium whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'border-primary text-primary bg-background shadow-xs font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <Icon className={`size-3.5 ${tab.highlight && !isActive ? 'text-primary' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className='p-5 overflow-y-auto flex-1 text-xs space-y-5'>
          {loading && !detailData ? (
            <div className='py-16 text-center text-muted-foreground space-y-2'>
              <div className='size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto' />
              <p>Loading candidate telemetry snapshot...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW — neutral throughout; color is reserved for
                  the handful of values that are genuinely an alert
                  (proctoring strikes, incident reason, needs-attention). */}
              {activeTab === 'overview' && (
                <div className='space-y-5'>
                  {/* Quick Stat Tiles */}
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                    <div className='p-3 bg-muted/30 border rounded-lg space-y-1'>
                      <span className='text-muted-foreground text-[11px] block font-medium'>Section</span>
                      <p className='font-bold text-sm text-foreground break-words'>
                        {sectionLabel(candidate.currentSectionKey)}
                      </p>
                    </div>
                    <div className='p-3 bg-muted/30 border rounded-lg space-y-1'>
                      <span className='text-muted-foreground text-[11px] block font-medium'>Question</span>
                      <p className='font-bold text-sm text-foreground'>
                        #{candidate.currentQuestionIndex + 1} of {candidate.totalQuestions}
                      </p>
                    </div>
                    <div className='p-3 bg-muted/30 border rounded-lg space-y-1'>
                      <span className='text-muted-foreground text-[11px] block font-medium'>Answered</span>
                      <p className='font-bold text-sm text-foreground'>
                        {candidate.answeredCount} / {candidate.totalQuestions}
                      </p>
                    </div>
                    <div className='p-3 bg-muted/30 border rounded-lg space-y-1'>
                      <span className='text-muted-foreground text-[11px] block font-medium'>Time left</span>
                      <p className='font-bold text-sm font-mono text-foreground'>
                        {isDone ? '—' : formatTime(candidate.remainingTimeSeconds)}
                      </p>
                    </div>
                  </div>

                  {/* Telemetry & State Grids — label above value, so a long
                      badge or number never has to squeeze onto the same
                      line as its label and wrap mid-word. */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='border rounded-lg p-4 space-y-3 bg-card'>
                      <h4 className='font-semibold text-xs text-foreground flex items-center gap-1.5'>
                        <Activity className='size-3.5 text-muted-foreground' />
                        Connection &amp; autosave
                      </h4>
                      <dl className='space-y-2.5 text-xs divide-y'>
                        <div className='flex items-center justify-between gap-3 pt-1'>
                          <dt className='text-muted-foreground'>Network</dt>
                          <dd className='font-semibold text-foreground flex items-center gap-1.5 shrink-0'>
                            <span
                              className={`size-1.5 rounded-full ${candidate.networkStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            />
                            {candidate.networkStatus}
                          </dd>
                        </div>
                        <div className='flex items-center justify-between gap-3 pt-1.5'>
                          <dt className='text-muted-foreground'>Latency</dt>
                          <dd className='font-mono font-medium text-foreground shrink-0'>
                            {isDone ? '—' : `${candidate.latencyMs} ms`}
                          </dd>
                        </div>
                        <div className='flex items-center justify-between gap-3 pt-1.5'>
                          <dt className='text-muted-foreground'>Autosave</dt>
                          <dd className='font-medium text-foreground shrink-0'>{candidate.autosaveHealth}</dd>
                        </div>
                        <div className='flex items-center justify-between gap-3 pt-1.5'>
                          <dt className='text-muted-foreground'>Proctoring strikes</dt>
                          <dd className={`font-semibold shrink-0 ${candidate.proctoringStrikes > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                            {candidate.proctoringStrikes} / 5
                          </dd>
                        </div>
                        <div className='flex items-center justify-between gap-3 pt-1.5'>
                          <dt className='text-muted-foreground'>Last heartbeat</dt>
                          <dd className='font-medium text-foreground shrink-0'>
                            {Math.max(0, Math.round((Date.now() - (candidate.lastHeartbeatAt || Date.now())) / 1000))}s ago
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className='border rounded-lg p-4 space-y-3 bg-card'>
                      <h4 className='font-semibold text-xs text-foreground flex items-center gap-1.5'>
                        {isDone ? (
                          <CheckCircle className='size-3.5 text-emerald-500' />
                        ) : (
                          <Activity className='size-3.5 text-muted-foreground' />
                        )}
                        Submission status
                      </h4>
                      <dl className='space-y-2.5 text-xs divide-y'>
                        <div className='flex items-center justify-between gap-3 pt-1'>
                          <dt className='text-muted-foreground'>State</dt>
                          <dd className='shrink-0'>
                            <Badge variant='outline' className='font-mono font-normal'>{candidate.status}</Badge>
                          </dd>
                        </div>
                        <div className='flex items-center justify-between gap-3 pt-1.5'>
                          <dt className='text-muted-foreground'>Trigger</dt>
                          <dd className='font-medium text-foreground shrink-0'>
                            {candidate.submissionSource === 'USER' ? 'Candidate (Self-Submitted)' : (candidate.submissionSource || '—')}
                          </dd>
                        </div>
                        {isAutoSubmitted ? (
                          <div className='flex items-start justify-between gap-3 pt-1.5'>
                            <dt className='text-muted-foreground shrink-0'>Incident reason</dt>
                            <dd className='font-medium text-rose-600 dark:text-rose-400 text-right break-words'>
                              {candidate.submissionReason || (candidate.incidentReasons?.length ? candidate.incidentReasons.join(', ') : 'None')}
                            </dd>
                          </div>
                        ) : (
                          <div className='flex items-start justify-between gap-3 pt-1.5'>
                            <dt className='text-muted-foreground shrink-0'>Submission reason</dt>
                            <dd className='font-medium text-foreground text-right break-words'>
                              {candidate.submissionReason === 'USER_SUBMIT' ? 'Voluntary Submission by Candidate' : (candidate.submissionReason || 'Completed normally')}
                            </dd>
                          </div>
                        )}
                        <div className='flex items-center justify-between gap-3 pt-1.5'>
                          <dt className='text-muted-foreground'>Needs attention</dt>
                          <dd className={`font-semibold shrink-0 ${candidate.isNeedsAttention ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                            {candidate.isNeedsAttention ? 'Yes' : 'No'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Incident Reasons Callout */}
                  {(candidate.incidentReasons?.length || 0) > 0 && (
                    <div className='p-3.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-1.5'>
                      <div className='flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold text-xs'>
                        <AlertTriangle className='size-4' />
                        Active incident flags
                      </div>
                      <div className='flex flex-wrap gap-1.5 pt-1'>
                        {candidate.incidentReasons.map((r, i) => (
                          <Badge key={i} variant='outline' className='border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium'>
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ADMIN ACTIONS (COMPREHENSIVE CONTROL CENTER) */}
              {activeTab === 'adminActions' && (
                <div className='space-y-6'>
                  {isDone ? (
                    <div className='border rounded-lg p-5 bg-card space-y-4 shadow-2xs border-emerald-200 dark:border-emerald-900/40'>
                      <div className='flex items-start gap-3.5'>
                        <div className='size-9 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5'>
                          <CheckCircle className='size-5' />
                        </div>
                        <div className='space-y-1.5 flex-1'>
                          <div className='flex items-center gap-2'>
                            <h4 className='font-semibold text-sm text-foreground'>
                              Assessment Already Submitted & Finalized
                            </h4>
                            <Badge variant='outline' className='text-[10px] font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'>
                              {candidate.status}
                            </Badge>
                          </div>
                          <p className='text-xs text-muted-foreground leading-relaxed'>
                            This candidate has already concluded and submitted their examination. Active proctoring controls (granting additional test time and emergency force submission) are disabled because the attempt state is locked.
                          </p>
                          <div className='flex flex-wrap items-center gap-4 pt-2 text-xs border-t mt-3'>
                            <div>
                              <span className='text-muted-foreground'>Submission Trigger: </span>
                              <strong className='text-foreground'>
                                {candidate.submissionSource === 'USER' ? 'Candidate (Self-Submitted)' : (candidate.submissionSource || 'Candidate Submission')}
                              </strong>
                            </div>
                            {candidate.submissionReason && (
                              <div>
                                <span className='text-muted-foreground'>Reason: </span>
                                <strong className='text-foreground'>
                                  {candidate.submissionReason === 'USER_SUBMIT' ? 'Voluntary Submission by Candidate' : candidate.submissionReason}
                                </strong>
                              </div>
                            )}
                            <div>
                              <span className='text-muted-foreground'>Questions Answered: </span>
                              <strong className='text-foreground'>{candidate.answeredCount} / {candidate.totalQuestions}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Action Section 1: Quick Time Grants */}
                      <div className='border rounded-lg p-4 bg-card space-y-3 shadow-2xs'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <h4 className='font-semibold text-xs text-foreground flex items-center gap-1.5'>
                              <Clock className='size-3.5 text-primary' />
                              Grant Additional Test Time
                            </h4>
                            <p className='text-[11px] text-muted-foreground'>
                              Extend the candidate timer directly on server state without resetting exam progress.
                            </p>
                          </div>
                          <span className='font-mono font-bold text-xs text-primary bg-primary/10 px-2 py-1 rounded'>
                            Current: {formatTime(candidate.remainingTimeSeconds)}
                          </span>
                        </div>

                        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1'>
                          {[5, 10, 15, 30].map((mins) => (
                            <Button
                              key={mins}
                              size='sm'
                              variant='outline'
                              disabled={extendingTime}
                              onClick={() => handleExtendTime(mins, `Admin granted +${mins}m extension`)}
                              className='h-8 text-xs font-semibold gap-1 hover:bg-primary hover:text-primary-foreground transition-colors'
                            >
                              <Plus className='size-3' />
                              +{mins} Minutes
                            </Button>
                          ))}
                        </div>

                        <div className='pt-2 border-t flex flex-col sm:flex-row items-center gap-2'>
                          <Input
                            type='number'
                            min='1'
                            max='180'
                            value={customMinutes}
                            onChange={(e) => setCustomMinutes(e.target.value)}
                            placeholder='Custom mins'
                            className='w-full sm:w-32 h-8 text-xs'
                          />
                          <Input
                            value={timeReason}
                            onChange={(e) => setTimeReason(e.target.value)}
                            placeholder='Extension justification for audit log...'
                            className='flex-1 h-8 text-xs'
                          />
                          <Button
                            size='sm'
                            disabled={extendingTime || !customMinutes}
                            onClick={() => handleExtendTime(Number(customMinutes) || 5, timeReason)}
                            className='h-8 text-xs gap-1.5 shrink-0'
                          >
                            <Zap className='size-3' />
                            Apply Custom
                          </Button>
                        </div>
                      </div>

                      {/* Action Section 2: Recovery / Resume Control */}
                      <div className='border rounded-lg p-4 bg-card space-y-3 shadow-2xs'>
                        <div className='flex items-start justify-between gap-3'>
                          <div>
                            <h4 className='font-semibold text-xs text-foreground flex items-center gap-1.5'>
                              <RotateCcw className='size-3.5 text-rose-500' />
                              Safe Resume & State Recovery
                            </h4>
                            <p className='text-[11px] text-muted-foreground mt-0.5'>
                              Authorize the candidate to resume testing if their session was prematurely auto-submitted or interrupted.
                            </p>
                          </div>
                          <Button
                            size='sm'
                            variant={isAutoSubmitted ? 'destructive' : 'outline'}
                            onClick={() => {
                              onClose();
                              onOpenRecovery(candidate);
                            }}
                            className='h-8 text-xs gap-1.5 shrink-0 font-semibold'
                          >
                            <RotateCcw className='size-3.5' />
                            Launch Recovery Center
                          </Button>
                        </div>
                      </div>

                      {/* Action Section 3: Emergency Force Submit */}
                      <div className='border rounded-lg p-4 bg-card space-y-3 shadow-2xs border-rose-200 dark:border-rose-900/50'>
                        <div className='space-y-1'>
                          <h4 className='font-semibold text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5'>
                            <StopCircle className='size-3.5' />
                            Emergency Force Final Submission
                          </h4>
                          <p className='text-[11px] text-muted-foreground'>
                            Immediately terminate candidate execution and lock final state for evaluation.
                          </p>
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1'>
                          <select
                            value={forceSubmitReason}
                            onChange={(e) => setForceSubmitReason(e.target.value)}
                            className='h-8 px-2 rounded-md border text-xs bg-background'
                          >
                            <option value='ADMIN_ACTION'>Admin Manual Decision</option>
                            <option value='PROCTORING_LIMIT'>Cheating / Proctoring Strike Limit</option>
                            <option value='TIME_EXPIRED'>Time Expired / Overdue</option>
                            <option value='SYSTEM_FAILURE'>Unresolvable Client Failure</option>
                          </select>
                          <Input
                            value={forceSubmitDetails}
                            onChange={(e) => setForceSubmitDetails(e.target.value)}
                            placeholder='Reason details (optional)...'
                            className='h-8 text-xs'
                          />
                        </div>

                        <Button
                          size='sm'
                          variant='destructive'
                          disabled={isForceSubmitting}
                          onClick={handleForceSubmit}
                          className='h-8 text-xs gap-1.5 font-semibold'
                        >
                          <StopCircle className='size-3.5' />
                          {isForceSubmitting ? 'Submitting...' : 'Confirm Force Submit Attempt'}
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Action Section 4: Administrative Audit Trail */}
                  <div className='space-y-2 pt-2'>
                    <h4 className='font-semibold text-xs text-foreground flex items-center gap-1.5'>
                      <History className='size-3.5 text-muted-foreground' />
                      Administrative Audit Trail
                    </h4>
                    {detailData?.recoveryLogs?.length === 0 ? (
                      <p className='text-muted-foreground text-xs p-3 bg-muted/20 rounded border'>
                        No administrative recovery actions recorded yet.
                      </p>
                    ) : (
                      <div className='border rounded-md divide-y'>
                        {detailData?.recoveryLogs?.map((log: any) => (
                          <div key={log.id} className='p-2.5 text-xs space-y-1 bg-card'>
                            <div className='flex items-center justify-between'>
                              <span className='font-semibold text-foreground'>
                                Action: {log.previousStatus} → {log.newStatus}
                              </span>
                              <span className='text-[10px] text-muted-foreground font-mono'>
                                {new Date(log.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className='text-muted-foreground text-[11px]'>
                              Admin: {log.adminEmail || log.adminId} • Reason: {log.reason}
                            </p>
                            {log.extraTimeSeconds > 0 && (
                              <p className='text-primary font-medium text-[11px]'>
                                Extra Time Granted: +{Math.round(log.extraTimeSeconds / 60)} min
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: TIMELINE */}
              {activeTab === 'timeline' && (
                <div className='space-y-3'>
                  <TabHeading icon={History}>Attempt event history</TabHeading>
                  {(detailData?.events?.length || 0) === 0 ? (
                    <EmptyState>No events recorded yet.</EmptyState>
                  ) : (
                    <div className='border rounded-lg divide-y max-h-96 overflow-y-auto'>
                      {detailData.events.map((ev: any) => (
                        <div key={ev.id} className='p-3 space-y-1.5'>
                          <div className='flex items-center justify-between gap-3'>
                            <div className='flex items-center gap-2 min-w-0'>
                              <Badge variant='outline' className='text-[10px] font-mono shrink-0'>
                                {ev.eventType}
                              </Badge>
                              <span className='text-[10px] text-muted-foreground truncate'>
                                via {ev.source}
                              </span>
                            </div>
                            <div className='flex items-center gap-2 shrink-0'>
                              {(ev.severity === 'P0' || ev.severity === 'P1') && (
                                <Badge variant='outline' className='text-[10px] border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400'>
                                  {ev.severity}
                                </Badge>
                              )}
                              <span className='text-[10px] text-muted-foreground font-mono'>
                                {new Date(ev.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          {ev.correlationId && (
                            <p className='text-[10px] font-mono text-muted-foreground'>
                              Correlation ID: {ev.correlationId}
                            </p>
                          )}
                          {ev.metadata && <MetadataBlock data={ev.metadata} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ANSWERS */}
              {activeTab === 'answers' && (
                <div className='space-y-3'>
                  <TabHeading icon={FileText}>
                    Saved answers ({detailData?.answers?.length || 0})
                  </TabHeading>
                  {(detailData?.answers?.length || 0) === 0 ? (
                    <EmptyState>No answers saved yet.</EmptyState>
                  ) : (
                    <div className='border rounded-lg divide-y max-h-96 overflow-y-auto'>
                      {detailData.answers.map((ans: any, idx: number) => (
                        <div key={idx} className='p-3 space-y-1.5'>
                          <div className='flex items-center justify-between gap-2'>
                            <div className='flex items-center gap-2 min-w-0'>
                              <span className='font-semibold text-foreground truncate'>
                                Q: {ans.questionText || ans.questionId}
                              </span>
                              {ans.isMarkedForReview && (
                                <Badge variant='outline' className='text-[10px] shrink-0'>
                                  Marked for review
                                </Badge>
                              )}
                            </div>
                            <span className='text-[10px] text-muted-foreground whitespace-nowrap font-mono shrink-0'>
                              {ans.timeSpentSeconds}s • {new Date(ans.savedAt).toLocaleTimeString()}
                            </span>
                          </div>
                          {(() => {
                            const coding = parseCodingAnswer(ans.answer);
                            if (coding) return <CodingAnswerBlock submission={coding} />;
                            return (
                              <div className='p-1.5 bg-muted/40 rounded text-[11px] break-all'>
                                {ans.answerText ||
                                  (typeof ans.answer === 'object'
                                    ? JSON.stringify(ans.answer)
                                    : formatMetadataValue('answer', String(ans.answer)))}
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: PROGRESS */}
              {activeTab === 'progress' && (
                <div className='space-y-3'>
                  <TabHeading icon={Activity}>Section-by-section progress</TabHeading>
                  {(detailData?.sections?.length || 0) === 0 ? (
                    <EmptyState>No sections defined for this assessment.</EmptyState>
                  ) : (
                    <div className='border rounded-lg divide-y'>
                      {detailData.sections.map((sec: any) => (
                        <div key={sec.id} className='p-3 flex items-center justify-between gap-3'>
                          <div className='min-w-0'>
                            <p className='font-semibold text-foreground truncate'>
                              {sectionLabel(sec.sectionName || sec.sectionKey)}
                            </p>
                            <span className='text-[11px] text-muted-foreground'>
                              {sec.questions?.length || 0} questions • {Math.round(sec.durationSeconds / 60)} min
                            </span>
                          </div>
                          <Badge variant='outline' className='shrink-0'>{sec.status || 'UPCOMING'}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: PROCTORING */}
              {activeTab === 'proctoring' && (
                <div className='space-y-3'>
                  <div className='p-4 border rounded-lg flex items-center justify-between bg-card'>
                    <div>
                      <TabHeading icon={ShieldAlert}>Proctoring strikes</TabHeading>
                      <p className='text-[11px] text-muted-foreground mt-0.5'>
                        Total strikes recorded for this attempt
                      </p>
                    </div>
                    <span className={`text-2xl font-bold ${candidate.proctoringStrikes > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                      {candidate.proctoringStrikes} / 5
                    </span>
                  </div>

                  <TabHeading icon={History}>Violation history</TabHeading>
                  {(detailData?.auditTimeline?.filter((l: any) => l.eventType.includes('PROCTORING'))?.length || 0) === 0 ? (
                    <EmptyState>No proctoring strikes recorded.</EmptyState>
                  ) : (
                    <div className='border rounded-lg divide-y'>
                      {detailData.auditTimeline
                        .filter((l: any) => l.eventType.includes('PROCTORING'))
                        .map((log: any) => (
                          <div key={log.id} className='p-3 space-y-1'>
                            <div className='flex items-center justify-between gap-3'>
                              <span className='font-semibold text-rose-600 dark:text-rose-400'>{log.eventType}</span>
                              <span className='text-[10px] text-muted-foreground font-mono shrink-0'>
                                {new Date(log.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {log.metadata && <MetadataBlock data={log.metadata} />}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: NETWORK */}
              {activeTab === 'network' && (
                <div className='space-y-3'>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='border rounded-lg p-3 bg-card'>
                      <span className='text-muted-foreground text-[11px] block'>Current latency</span>
                      <p className='text-xl font-bold font-mono text-foreground'>{candidate.latencyMs} ms</p>
                    </div>
                    <div className='border rounded-lg p-3 bg-card'>
                      <span className='text-muted-foreground text-[11px] block'>Connection status</span>
                      <p className='text-xl font-bold text-foreground flex items-center gap-2'>
                        <span className={`size-2 rounded-full ${candidate.networkStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {candidate.networkStatus}
                      </p>
                    </div>
                  </div>

                  <TabHeading icon={Network}>Connection transitions</TabHeading>
                  {(detailData?.events?.filter((e: any) =>
                    ['DISCONNECTED', 'RECONNECTED', 'CANDIDATE_DISCONNECTED'].includes(e.eventType),
                  )?.length || 0) === 0 ? (
                    <EmptyState>Clean connection — no disconnections recorded.</EmptyState>
                  ) : (
                    <div className='border rounded-lg divide-y'>
                      {detailData.events
                        .filter((e: any) =>
                          ['DISCONNECTED', 'RECONNECTED', 'CANDIDATE_DISCONNECTED'].includes(e.eventType),
                        )
                        .map((e: any) => (
                          <div key={e.id} className='p-2.5 flex items-center justify-between text-xs'>
                            <span className='font-medium text-foreground'>{e.eventType}</span>
                            <span className='text-muted-foreground text-[11px] font-mono'>
                              {new Date(e.timestamp).toLocaleString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: ERRORS */}
              {activeTab === 'errors' && (
                <div className='space-y-3'>
                  <TabHeading icon={AlertTriangle}>Execution &amp; autosave errors</TabHeading>
                  {(detailData?.auditTimeline?.filter((l: any) => l.eventType.includes('FAILED'))?.length || 0) === 0 ? (
                    <EmptyState>No runtime errors logged.</EmptyState>
                  ) : (
                    <div className='border rounded-lg divide-y'>
                      {detailData.auditTimeline
                        .filter((l: any) => l.eventType.includes('FAILED'))
                        .map((err: any) => (
                          <div key={err.id} className='p-3 space-y-1.5'>
                            <div className='flex items-center justify-between gap-3'>
                              <span className='font-semibold text-rose-600 dark:text-rose-400'>{err.eventType}</span>
                              <span className='text-[10px] text-muted-foreground font-mono shrink-0'>
                                {new Date(err.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {err.metadata && <MetadataBlock data={err.metadata} />}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 9: SUBMISSIONS */}
              {activeTab === 'submissions' && (
                <div className='space-y-3'>
                  <TabHeading icon={Send}>Submission diagnostics</TabHeading>
                  <dl className='border rounded-lg p-4 space-y-2.5 bg-card text-xs divide-y'>
                    <div className='flex items-center justify-between pt-1 first:pt-0'>
                      <dt className='text-muted-foreground'>Status</dt>
                      <dd><Badge variant='outline' className='font-mono font-normal'>{detailData?.testInstance?.status || candidate.status}</Badge></dd>
                    </div>
                    <div className='flex items-center justify-between pt-1.5'>
                      <dt className='text-muted-foreground'>Submission trigger</dt>
                      <dd className='font-medium text-foreground'>
                        {detailData?.testInstance?.submissions?.[0]?.source || candidate.submissionSource || '—'}
                      </dd>
                    </div>
                    <div className='flex items-start justify-between gap-3 pt-1.5'>
                      <dt className='text-muted-foreground shrink-0'>Submission reason</dt>
                      <dd className='font-medium text-foreground text-right break-words'>
                        {detailData?.testInstance?.submissions?.[0]?.reason || candidate.submissionReason || '—'}
                      </dd>
                    </div>
                    <div className='flex items-center justify-between pt-1.5'>
                      <dt className='text-muted-foreground'>Auto-submitted</dt>
                      <dd className='font-semibold text-foreground'>
                        {detailData?.testInstance?.submissions?.[0]?.isAutoSubmit ? 'Yes' : 'No'}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
