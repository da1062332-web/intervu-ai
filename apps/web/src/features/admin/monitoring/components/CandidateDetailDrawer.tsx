'use client';

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { CandidateItem } from '../hooks/useLiveMonitoring';
import { apiClient } from '@/services/api/client';
import { toast } from 'sonner';

interface CandidateDetailDrawerProps {
  candidate: CandidateItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecovery: (candidate: CandidateItem) => void;
}

export function CandidateDetailDrawer({
  candidate,
  isOpen,
  onClose,
  onOpenRecovery,
}: CandidateDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'timeline'
    | 'answers'
    | 'progress'
    | 'proctoring'
    | 'network'
    | 'errors'
    | 'submissions'
    | 'adminActions'
  >('overview');

  const [detailData, setDetailData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!candidate || !isOpen) return;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await apiClient.request<any>(
          `/admin/monitoring/assessments/${candidate.assessmentId}/candidate/${candidate.attemptId}`,
        );
        setDetailData(res);
      } catch (err) {
        toast.error('Failed to load candidate details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [candidate, isOpen]);

  if (!candidate) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'timeline', label: 'Timeline', icon: History },
    { id: 'answers', label: 'Answers', icon: FileText },
    { id: 'progress', label: 'Progress', icon: Activity },
    { id: 'proctoring', label: 'Proctoring', icon: ShieldAlert },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'errors', label: 'Errors', icon: AlertTriangle },
    { id: 'submissions', label: 'Submissions', icon: Send },
    { id: 'adminActions', label: 'Admin Actions', icon: Lock },
  ];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent side='right' className='sm:max-w-4xl w-full flex flex-col p-0 overflow-hidden'>
        {/* Header */}
        <SheetHeader className='p-4 border-b bg-muted/20 flex flex-row items-center justify-between space-y-0'>
          <div className='flex items-center gap-3'>
            <div className='size-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm'>
              {candidate.candidateName.charAt(0).toUpperCase()}
            </div>
            <div>
              <SheetTitle className='text-base font-semibold flex items-center gap-2'>
                {candidate.candidateName}
                <Badge variant='outline' className='font-mono text-xs'>
                  {candidate.status}
                </Badge>
              </SheetTitle>
              <SheetDescription className='text-xs text-muted-foreground'>
                {candidate.candidateEmail} • Attempt ID: {candidate.attemptId}
              </SheetDescription>
            </div>
          </div>

          <div className='flex items-center gap-2 pr-6'>
            {(candidate.status === 'AUTO_SUBMITTED' || candidate.status === 'ADMIN_REVIEW') && (
              <Button
                size='sm'
                variant='destructive'
                onClick={() => {
                  onClose();
                  onOpenRecovery(candidate);
                }}
                className='h-8 text-xs gap-1.5'
              >
                <RotateCcw className='size-3.5' />
                Open Recovery Center
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* 9-Tab Navigation */}
        <div className='flex items-center border-b bg-background px-4 overflow-x-auto text-xs'>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-2.5 px-3 font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className='size-3.5' />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className='p-5 overflow-y-auto flex-1 text-xs space-y-4'>
          {loading ? (
            <div className='py-12 text-center text-muted-foreground'>Loading candidate data...</div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                    <div className='p-3 bg-muted/40 rounded-lg space-y-1'>
                      <span className='text-muted-foreground text-[11px]'>Current Section</span>
                      <p className='font-semibold text-sm'>{candidate.currentSectionKey}</p>
                    </div>
                    <div className='p-3 bg-muted/40 rounded-lg space-y-1'>
                      <span className='text-muted-foreground text-[11px]'>Current Question</span>
                      <p className='font-semibold text-sm'>
                        Question #{candidate.currentQuestionIndex + 1}
                      </p>
                    </div>
                    <div className='p-3 bg-muted/40 rounded-lg space-y-1'>
                      <span className='text-muted-foreground text-[11px]'>Questions Answered</span>
                      <p className='font-semibold text-sm'>
                        {candidate.answeredCount} / {candidate.totalQuestions}
                      </p>
                    </div>
                    <div className='p-3 bg-muted/40 rounded-lg space-y-1'>
                      <span className='text-muted-foreground text-[11px]'>Remaining Time</span>
                      <p className='font-semibold text-sm font-mono text-primary'>
                        {formatTime(candidate.remainingTimeSeconds)}
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-2'>
                    <div className='border rounded-lg p-3 space-y-2'>
                      <h4 className='font-semibold text-xs'>Live Telemetry Health</h4>
                      <div className='space-y-1.5 text-xs text-muted-foreground'>
                        <div className='flex justify-between'>
                          <span>Network Status:</span>
                          <span className='font-medium text-foreground'>{candidate.networkStatus}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span>Latency:</span>
                          <span className='font-medium text-foreground'>{candidate.latencyMs} ms</span>
                        </div>
                        <div className='flex justify-between'>
                          <span>Autosave Health:</span>
                          <span className='font-medium text-foreground'>{candidate.autosaveHealth}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span>Proctoring Strikes:</span>
                          <span className='font-medium text-foreground'>
                            {candidate.proctoringStrikes}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span>Last Heartbeat:</span>
                          <span className='font-medium text-foreground'>
                            {Math.round((Date.now() - candidate.lastHeartbeatAt) / 1000)}s ago
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className='border rounded-lg p-3 space-y-2'>
                      <h4 className='font-semibold text-xs'>Submission & Recovery Status</h4>
                      <div className='space-y-1.5 text-xs text-muted-foreground'>
                        <div className='flex justify-between'>
                          <span>Current State:</span>
                          <Badge variant='outline'>{candidate.status}</Badge>
                        </div>
                        <div className='flex justify-between'>
                          <span>Submission Source:</span>
                          <span className='font-medium text-foreground'>
                            {candidate.submissionSource || 'N/A'}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span>Submission Reason:</span>
                          <span className='font-medium text-foreground'>
                            {candidate.submissionReason || 'N/A'}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span>Needs Attention:</span>
                          <span className='font-medium text-foreground'>
                            {candidate.isNeedsAttention ? 'YES' : 'NO'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TIMELINE */}
              {activeTab === 'timeline' && (
                <div className='space-y-2'>
                  <h4 className='font-semibold text-xs'>Chronological Attempt Event Stream</h4>
                  {detailData?.events?.length === 0 ? (
                    <p className='text-muted-foreground text-xs'>No events recorded.</p>
                  ) : (
                    <div className='border rounded-md divide-y'>
                      {detailData?.events?.map((ev: any) => (
                        <div key={ev.id} className='p-2.5 flex items-start justify-between gap-3'>
                          <div className='space-y-0.5'>
                            <div className='flex items-center gap-2'>
                              <Badge variant='secondary' className='text-[10px] font-mono'>
                                {ev.eventType}
                              </Badge>
                              <span className='text-[10px] text-muted-foreground font-mono'>
                                {new Date(ev.timestamp).toLocaleTimeString()}
                              </span>
                              <span className='text-[10px] text-muted-foreground'>
                                Source: {ev.source}
                              </span>
                            </div>
                            {ev.correlationId && (
                              <p className='text-[10px] font-mono text-muted-foreground'>
                                CID: {ev.correlationId}
                              </p>
                            )}
                            {ev.metadata && (
                              <pre className='text-[10px] bg-muted/40 p-1 rounded overflow-x-auto max-w-lg'>
                                {JSON.stringify(ev.metadata)}
                              </pre>
                            )}
                          </div>
                          <Badge
                            variant={
                              ev.severity === 'P0' || ev.severity === 'P1'
                                ? 'destructive'
                                : 'outline'
                            }
                            className='text-[10px]'
                          >
                            {ev.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ANSWERS */}
              {activeTab === 'answers' && (
                <div className='space-y-2'>
                  <h4 className='font-semibold text-xs'>
                    Saved Answers Snapshot ({detailData?.answers?.length || 0})
                  </h4>
                  <div className='border rounded-md divide-y max-h-96 overflow-y-auto'>
                    {detailData?.answers?.map((ans: any, idx: number) => (
                      <div key={idx} className='p-2.5 flex items-start justify-between gap-2'>
                        <div className='space-y-1 max-w-xl'>
                          <div className='flex items-center gap-2'>
                            <span className='font-semibold'>Q: {ans.questionId}</span>
                            <span className='text-[10px] text-muted-foreground'>
                              Time: {ans.timeSpentSeconds}s
                            </span>
                            {ans.isMarkedForReview && (
                              <Badge variant='secondary' className='text-[10px]'>
                                Marked for review
                              </Badge>
                            )}
                          </div>
                          <div className='p-1.5 bg-muted/40 rounded font-mono text-[11px] break-all'>
                            {typeof ans.answer === 'object'
                              ? JSON.stringify(ans.answer)
                              : String(ans.answer)}
                          </div>
                        </div>
                        <span className='text-[10px] text-muted-foreground whitespace-nowrap'>
                          {new Date(ans.savedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: PROGRESS */}
              {activeTab === 'progress' && (
                <div className='space-y-3'>
                  <h4 className='font-semibold text-xs'>Section-by-Section Progress</h4>
                  <div className='border rounded-md divide-y'>
                    {detailData?.sections?.map((sec: any) => (
                      <div key={sec.id} className='p-3 flex items-center justify-between'>
                        <div>
                          <p className='font-semibold'>{sec.sectionName || sec.sectionKey}</p>
                          <span className='text-[11px] text-muted-foreground'>
                            {sec.questions?.length || 0} Questions • Duration:{' '}
                            {Math.round(sec.durationSeconds / 60)} min
                          </span>
                        </div>
                        <Badge variant='outline'>{sec.status || 'UPCOMING'}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: PROCTORING */}
              {activeTab === 'proctoring' && (
                <div className='space-y-3'>
                  <div className='p-3 border rounded-lg flex items-center justify-between bg-muted/20'>
                    <div>
                      <h4 className='font-semibold text-xs'>Proctoring Strike Summary</h4>
                      <p className='text-xs text-muted-foreground'>
                        Total strikes recorded for this attempt
                      </p>
                    </div>
                    <span className='text-2xl font-bold text-rose-500'>
                      {candidate.proctoringStrikes} / 5
                    </span>
                  </div>

                  <h4 className='font-semibold text-xs pt-2'>Proctoring Violation History</h4>
                  <div className='border rounded-md divide-y'>
                    {detailData?.auditTimeline
                      ?.filter((l: any) => l.eventType.includes('PROCTORING'))
                      .map((log: any) => (
                        <div key={log.id} className='p-2.5 flex items-center justify-between text-xs'>
                          <div>
                            <span className='font-semibold'>{log.eventType}</span>
                            <p className='text-[11px] text-muted-foreground'>
                              {JSON.stringify(log.metadata)}
                            </p>
                          </div>
                          <span className='text-[10px] text-muted-foreground'>
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 6: NETWORK */}
              {activeTab === 'network' && (
                <div className='space-y-3'>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='border rounded-lg p-3'>
                      <span className='text-muted-foreground text-[11px]'>Current Latency</span>
                      <p className='text-xl font-bold font-mono'>{candidate.latencyMs} ms</p>
                    </div>
                    <div className='border rounded-lg p-3'>
                      <span className='text-muted-foreground text-[11px]'>Connection Status</span>
                      <p className='text-xl font-bold'>{candidate.networkStatus}</p>
                    </div>
                  </div>

                  <h4 className='font-semibold text-xs pt-2'>Connection Transitions</h4>
                  <div className='border rounded-md divide-y'>
                    {detailData?.events
                      ?.filter((e: any) =>
                        ['DISCONNECTED', 'RECONNECTED', 'CANDIDATE_DISCONNECTED'].includes(
                          e.eventType,
                        ),
                      )
                      .map((e: any) => (
                        <div key={e.id} className='p-2 flex items-center justify-between text-xs'>
                          <span className='font-medium'>{e.eventType}</span>
                          <span className='text-muted-foreground text-[11px]'>
                            {new Date(e.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 7: ERRORS */}
              {activeTab === 'errors' && (
                <div className='space-y-2'>
                  <h4 className='font-semibold text-xs'>Execution & Autosave Error Logs</h4>
                  {detailData?.auditTimeline?.filter((l: any) => l.eventType.includes('FAILED'))
                    ?.length === 0 ? (
                    <p className='text-muted-foreground text-xs'>No runtime errors logged.</p>
                  ) : (
                    <div className='border rounded-md divide-y'>
                      {detailData?.auditTimeline
                        ?.filter((l: any) => l.eventType.includes('FAILED'))
                        .map((err: any) => (
                          <div key={err.id} className='p-2.5 text-xs space-y-1'>
                            <div className='flex items-center justify-between'>
                              <span className='font-bold text-rose-500'>{err.eventType}</span>
                              <span className='text-[10px] text-muted-foreground'>
                                {new Date(err.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <pre className='text-[10px] bg-muted/40 p-1.5 rounded'>
                              {JSON.stringify(err.metadata)}
                            </pre>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: SUBMISSIONS */}
              {activeTab === 'submissions' && (
                <div className='space-y-3'>
                  <h4 className='font-semibold text-xs'>Submission Diagnostics</h4>
                  <div className='border rounded-lg p-3 space-y-2 bg-muted/10'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Status:</span>
                      <Badge variant='outline'>{detailData?.testInstance?.status}</Badge>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Submission Source:</span>
                      <span className='font-semibold'>
                        {detailData?.testInstance?.submission?.source || 'N/A'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Submission Reason:</span>
                      <span className='font-semibold'>
                        {detailData?.testInstance?.submission?.reason || 'N/A'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Details:</span>
                      <span>
                        {detailData?.testInstance?.submission?.reasonDetails || 'None'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Auto-Submitted Flag:</span>
                      <span>
                        {detailData?.testInstance?.submission?.isAutoSubmit ? 'TRUE' : 'FALSE'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 9: ADMIN ACTIONS */}
              {activeTab === 'adminActions' && (
                <div className='space-y-2'>
                  <h4 className='font-semibold text-xs'>Administrative Audit Trail</h4>
                  {detailData?.recoveryLogs?.length === 0 ? (
                    <p className='text-muted-foreground text-xs'>
                      No administrative recovery actions recorded.
                    </p>
                  ) : (
                    <div className='border rounded-md divide-y'>
                      {detailData?.recoveryLogs?.map((log: any) => (
                        <div key={log.id} className='p-2.5 text-xs space-y-1'>
                          <div className='flex items-center justify-between'>
                            <span className='font-semibold'>
                              Action: {log.previousStatus} → {log.newStatus}
                            </span>
                            <span className='text-[10px] text-muted-foreground'>
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className='text-muted-foreground'>
                            Admin: {log.adminEmail || log.adminId} • Reason: {log.reason}
                          </p>
                          {log.extraTimeSeconds > 0 && (
                            <p className='text-primary font-medium'>
                              Extra Time Granted: +{Math.round(log.extraTimeSeconds / 60)} min
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
