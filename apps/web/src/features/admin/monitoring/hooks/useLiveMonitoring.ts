'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, buildUrl, getApiBaseUrl } from '@/services/api/client';
import { normalizeApiError } from '@/services/api/error';
import { toast } from 'sonner';

export interface CandidateItem {
  assessmentId: string;
  attemptId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateRole?: string;
  status:
    | 'NOT_STARTED'
    | 'STARTING'
    | 'ACTIVE'
    | 'DISCONNECTED'
    | 'RECONNECTING'
    | 'SUBMITTING'
    | 'SUBMITTED'
    | 'AUTO_SUBMITTED'
    | 'EVALUATING'
    | 'COMPLETED'
    | 'TERMINATED'
    | 'ADMIN_REVIEW'
    | 'RESUME_AUTHORIZED'
    | 'RESUMED';
  currentSectionKey: string;
  currentSectionName?: string;
  currentSectionIndex: number;
  currentQuestionId: string;
  currentQuestionIndex: number;
  answeredCount: number;
  totalQuestions: number;
  markedQuestionsCount: number;
  remainingTimeSeconds: number;
  expiresAt?: string;
  lastHeartbeatAt: number;
  latencyMs: number;
  networkStatus: string;
  autosaveHealth: string;
  unsyncedAnswersCount: number;
  proctoringStrikes: number;
  isNeedsAttention: boolean;
  incidentReasons: string[];
  submissionSource?: string;
  submissionReason?: string;
}

export interface MonitoringSummary {
  total: number;
  active: number;
  disconnected: number;
  reconnecting: number;
  submitting: number;
  autoSubmitted: number;
  submitted: number;
  completed: number;
  terminated: number;
  needsAttentionCount: number;
  avgLatencyMs: number;
  autosaveHealthPercentage: number;
}

export interface LiveAlert {
  id: string;
  assessmentId: string;
  attemptId?: string;
  candidateId?: string;
  candidateName?: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  category: string;
  title: string;
  message: string;
  metadata?: any;
  createdAt: string;
  isResolved: boolean;
}

export interface SystemHealthData {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  api: {
    uptimeSeconds: number;
    memoryUsageMb: number;
    heapUsedMb: number;
  };
  database: {
    status: 'HEALTHY' | 'UNHEALTHY';
    latencyMs: number;
  };
  redis: {
    status: 'HEALTHY' | 'UNHEALTHY' | 'DEGRADED';
  };
  queues: {
    status: 'HEALTHY' | 'DEGRADED';
    metrics?: any;
  };
}

export interface UseLiveMonitoringOptions {
  search?: string;
  status?: string;
  section?: string;
  attentionOnly?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  dateFilter?: 'today' | 'yesterday' | 'custom' | 'all';
  startDate?: string;
  endDate?: string;
}

// Snapshot polling: every 30s while SSE is live; otherwise start at 5s and double on
// each consecutive failure up to 30s, so an unhealthy API isn't hammered.
const CONNECTED_SYNC_MS = 30000;
const FALLBACK_POLL_BASE_MS = 5000;
const FALLBACK_POLL_MAX_MS = 30000;
const SSE_RECONNECT_MAX_MS = 30000;

const isMonitoredCandidate = (c: CandidateItem) =>
  c.candidateRole !== 'ADMIN' &&
  c.candidateRole !== 'PLAN_MANAGER' &&
  !c.candidateEmail?.toLowerCase().includes('admin@intervu.ai');

export function useLiveMonitoring(assessmentId: string, options: UseLiveMonitoringOptions = {}) {
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [needsAttention, setNeedsAttention] = useState<CandidateItem[]>([]);
  const [summary, setSummary] = useState<MonitoringSummary>({
    total: 0,
    active: 0,
    disconnected: 0,
    reconnecting: 0,
    submitting: 0,
    autoSubmitted: 0,
    submitted: 0,
    completed: 0,
    terminated: 0,
    needsAttentionCount: 0,
    avgLatencyMs: 0,
    autosaveHealthPercentage: 100,
  });
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, totalItems: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const optionsRef = useRef(options);
  const heartbeatBufferRef = useRef<Map<string, any>>(new Map());
  const inFlightRef = useRef(0);
  const requestSeqRef = useRef(0);
  const pollFailuresRef = useRef(0);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Fetch initial or refreshed snapshot
  const fetchSnapshot = useCallback(async (isBackground = false) => {
    if (!assessmentId) return;
    // Background polls never stack: skip if a request is still running
    if (isBackground && inFlightRef.current > 0) return;
    const seq = ++requestSeqRef.current;
    inFlightRef.current++;
    if (!isBackground) {
      setIsRefetching(true);
    }
    try {
      const opts = optionsRef.current;
      const queryParams = new URLSearchParams();
      if (opts.search) queryParams.set('search', opts.search);
      if (opts.status && opts.status !== 'ALL') queryParams.set('status', opts.status);
      if (opts.section) queryParams.set('section', opts.section);
      if (opts.attentionOnly) queryParams.set('attentionOnly', 'true');
      if (opts.sortBy) queryParams.set('sortBy', opts.sortBy);
      if (opts.sortOrder) queryParams.set('sortOrder', opts.sortOrder);
      if (opts.page) queryParams.set('page', String(opts.page));
      if (opts.limit) queryParams.set('limit', String(opts.limit));
      if (opts.dateFilter) queryParams.set('dateFilter', opts.dateFilter);
      if (opts.startDate) queryParams.set('startDate', opts.startDate);
      if (opts.endDate) queryParams.set('endDate', opts.endDate);

      const res = await apiClient.request<any>(
        `/admin/monitoring/assessments/${assessmentId}/snapshot?${queryParams.toString()}`,
      );

      pollFailuresRef.current = 0;
      // A newer request (e.g. after a filter change) supersedes this response
      if (res && seq === requestSeqRef.current) {
        setCandidates((res.candidates || []).filter(isMonitoredCandidate));
        setNeedsAttention((res.needsAttention || []).filter(isMonitoredCandidate));
        if (res.summary) setSummary(res.summary);
        if (res.alerts) setAlerts(res.alerts);
        if (res.systemHealth) setSystemHealth(res.systemHealth);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      const normalized = normalizeApiError(err);
      const isTransient =
        normalized.code === 'NETWORK_ERROR' ||
        normalized.status === 0 ||
        normalized.status === 408 ||
        (normalized.status >= 500 && normalized.status < 600);
      if (isTransient) pollFailuresRef.current++;

      // Transient/network errors self-resolve on the next poll cycle; skip logging to avoid noise.
      if (!isTransient) {
        console.error('Failed fetching assessment live snapshot', err);
      }
    } finally {
      inFlightRef.current--;
      if (seq === requestSeqRef.current) {
        setIsLoading(false);
        setIsRefetching(false);
      }
    }
  }, [assessmentId]);

  // Re-fetch snapshot when filter/query parameters change
  useEffect(() => {
    fetchSnapshot(false);
  }, [
    assessmentId,
    options.search,
    options.status,
    options.section,
    options.attentionOnly,
    options.sortBy,
    options.sortOrder,
    options.page,
    options.limit,
    options.dateFilter,
    options.startDate,
    options.endDate,
    fetchSnapshot,
  ]);

  // Connect to SSE stream (lifecycle tied strictly to assessmentId)
  useEffect(() => {
    if (!assessmentId) return;

    let isCancelled = false;
    let retryCount = 0;

    // High-concurrency telemetry buffer & real-time second-by-second countdown ticker
    const flushInterval = setInterval(() => {
      const hasHeartbeats = heartbeatBufferRef.current.size > 0;
      const updates = hasHeartbeats ? new Map(heartbeatBufferRef.current) : null;
      if (hasHeartbeats) {
        heartbeatBufferRef.current.clear();
      }

      setCandidates((prev) => {
        if (!prev || prev.length === 0) {
          if (!updates || updates.size === 0) return prev;
        }

        const existingIds = new Set((prev || []).map((c) => c.attemptId));

        // Update existing candidates with buffered heartbeats AND tick down remaining time in real time
        const updated = (prev || []).map((c) => {
          if (!c) return c;
          const p = updates?.get(c.attemptId);

          const isTerminal =
            c.status === 'SUBMITTED' ||
            c.status === 'COMPLETED' ||
            c.status === 'TERMINATED' ||
            p?.status === 'SUBMITTED' ||
            p?.status === 'COMPLETED';

          // Real-time remaining time calculation:
          // If expiresAt is set, calculate authoritative difference from Date.now();
          // otherwise countdown second-by-second for non-terminal candidates.
          let nextRemainingSeconds = c.remainingTimeSeconds;
          if (!isTerminal) {
            if (p?.remainingTimeSeconds !== undefined) {
              nextRemainingSeconds = p.remainingTimeSeconds;
            } else if (c.expiresAt) {
              nextRemainingSeconds = Math.max(
                0,
                Math.floor((new Date(c.expiresAt).getTime() - Date.now()) / 1000),
              );
            } else {
              nextRemainingSeconds = Math.max(0, c.remainingTimeSeconds - 1);
            }
          }

          if (!p) {
            // No new heartbeat, but tick down real-time remaining seconds
            if (nextRemainingSeconds !== c.remainingTimeSeconds) {
              return { ...c, remainingTimeSeconds: nextRemainingSeconds };
            }
            return c;
          }

          return {
            ...c,
            status: p.status ?? c.status,
            currentSectionKey: p.currentSectionKey ?? c.currentSectionKey,
            currentSectionName: p.currentSectionName ?? c.currentSectionName,
            currentQuestionIndex: p.currentQuestionIndex ?? c.currentQuestionIndex,
            answeredCount: p.answeredCount ?? c.answeredCount,
            remainingTimeSeconds: nextRemainingSeconds,
            latencyMs: p.latencyMs ?? c.latencyMs,
            autosaveHealth: p.autosaveHealth ?? c.autosaveHealth,
            networkStatus: p.networkStatus ?? c.networkStatus,
            isNeedsAttention: p.isNeedsAttention ?? c.isNeedsAttention,
            lastHeartbeatAt: p.lastHeartbeatAt ?? Date.now(),
          };
        });

        // If new candidates arrived that weren't in previous state, add them immediately!
        if (updates) {
          const newCandidates: CandidateItem[] = [];
          for (const [attemptId, p] of updates.entries()) {
            if (
              !existingIds.has(attemptId) &&
              p.candidateRole !== 'ADMIN' &&
              p.candidateRole !== 'PLAN_MANAGER'
            ) {
              newCandidates.push({
                assessmentId: p.assessmentId || assessmentId,
                attemptId: p.attemptId,
                candidateId: p.candidateId || '',
                candidateName: p.candidateName || 'Candidate',
                candidateEmail: p.candidateEmail || '',
                candidateRole: p.candidateRole || 'CANDIDATE',
                status: p.status || 'ACTIVE',
                currentSectionKey: p.currentSectionKey || 'section-1',
                currentSectionName: p.currentSectionName,
                currentSectionIndex: p.currentSectionIndex ?? 0,
                currentQuestionId: p.currentQuestionId || '',
                currentQuestionIndex: p.currentQuestionIndex ?? 0,
                answeredCount: p.answeredCount ?? 0,
                totalQuestions: p.totalQuestions ?? 20,
                markedQuestionsCount: p.markedQuestionsCount ?? 0,
                remainingTimeSeconds: p.remainingTimeSeconds ?? 3600,
                expiresAt: p.expiresAt,
                lastHeartbeatAt: p.lastHeartbeatAt ?? Date.now(),
                latencyMs: p.latencyMs ?? 0,
                networkStatus: p.networkStatus || 'ONLINE',
                autosaveHealth: p.autosaveHealth || 'HEALTHY',
                unsyncedAnswersCount: 0,
                proctoringStrikes: p.proctoringStrikes ?? 0,
                isNeedsAttention: p.isNeedsAttention ?? false,
                incidentReasons: p.incidentReasons || [],
              });
            }
          }
          if (newCandidates.length > 0) {
            return [...newCandidates, ...updated];
          }
        }

        return updated;
      });
    }, 1000);

    const handleEventData = (data: any) => {
      if (!data || data.type === 'PING') return;

      if (data.type === 'CANDIDATE_HEARTBEAT') {
        const p = data.payload || data;
        if (
          p?.attemptId &&
          p.candidateRole !== 'ADMIN' &&
          p.candidateRole !== 'PLAN_MANAGER'
        ) {
          heartbeatBufferRef.current.set(p.attemptId, p);
        }
        return;
      } else if (data.type === 'STATE_TRANSITION') {
        const p = data.payload || data;
        if (!p || p.candidateRole === 'ADMIN' || p.candidateRole === 'PLAN_MANAGER') return;
        let matched = false;
        let isNaturalTimeExpired = false;
        setCandidates((prev) =>
          (prev || []).map((c) => {
            if (c && c.attemptId === p.attemptId) {
              matched = true;
              const subReason = p.reason ?? c.submissionReason;
              isNaturalTimeExpired =
                subReason === 'TIME_EXPIRED' ||
                subReason === 'TIMEOUT' ||
                c.incidentReasons?.includes('TIME_EXPIRED') ||
                c.incidentReasons?.includes('Time Expired');
              const isAttentionState =
                ((p.newState === 'AUTO_SUBMITTED' && !isNaturalTimeExpired) || p.newState === 'ADMIN_REVIEW');
              const isClearedState =
                p.newState === 'ACTIVE' || p.newState === 'COMPLETED' || (p.newState === 'AUTO_SUBMITTED' && isNaturalTimeExpired);
              const effectiveStatus = (p.newState === 'AUTO_SUBMITTED' && isNaturalTimeExpired) ? 'SUBMITTED' : (p.newState || c.status);
              return {
                ...c,
                status: effectiveStatus,
                isNeedsAttention: isAttentionState ? true : (isNaturalTimeExpired ? false : c.isNeedsAttention),
                submissionReason: subReason,
                incidentReasons: isClearedState
                  ? []
                  : isAttentionState && p.reason
                    ? Array.from(new Set([...(c.incidentReasons || []), p.reason]))
                    : c.incidentReasons,
              };
            }
            return c;
          }),
        );

        // Update tallies only if it matches a monitored candidate
        if (matched) {
          setSummary((s) => ({
            ...s,
            active: p.newState === 'ACTIVE' ? (s?.active || 0) + 1 : Math.max(0, (s?.active || 0) - 1),
            autoSubmitted: (p.newState === 'AUTO_SUBMITTED' && !isNaturalTimeExpired) ? (s?.autoSubmitted || 0) + 1 : (s?.autoSubmitted || 0),
            submitted: (p.newState === 'SUBMITTED' || (p.newState === 'AUTO_SUBMITTED' && isNaturalTimeExpired)) ? (s?.submitted || 0) + 1 : (s?.submitted || 0),
          }));
        }
      } else if (data.type === 'CANDIDATE_DISCONNECTED') {
        const p = data.payload || data;
        if (!p || !p.attemptId) return;
        let matched = false;
        setCandidates((prev) =>
          (prev || []).map((c) => {
            if (c && c.attemptId === p.attemptId) {
              matched = true;
              return {
                ...c,
                status: 'DISCONNECTED',
                networkStatus: 'OFFLINE',
                isNeedsAttention: true,
                incidentReasons: Array.from(
                  new Set([...(c.incidentReasons || []), `Disconnected (>${p.silentDurationSeconds || 30}s)`]),
                ),
              };
            }
            return c;
          }),
        );
        if (matched) {
          setSummary((s) => ({
            ...s,
            active: Math.max(0, (s?.active || 0) - 1),
            disconnected: (s?.disconnected || 0) + 1,
            needsAttentionCount: (s?.needsAttentionCount || 0) + 1,
          }));
        }
      } else if (data.type === 'ALERT_EMITTED') {
        const alert = data.payload || data;
        if (!alert || !alert.id) return;
        if (alert.candidateRole === 'ADMIN' || alert.candidateRole === 'PLAN_MANAGER') return;
        setAlerts((prev) => [alert, ...(prev || []).filter((a) => a && a.id !== alert.id)]);
        if (alert.severity === 'P0' || alert.severity === 'P1') {
          toast.error(`[${alert.severity}] ${alert.title}`, {
            description: alert.message,
            duration: 8000,
          });
        }
      } else if (data.type === 'ALERT_RESOLVED') {
        const p = data.payload || data;
        const targetAlertId = p?.alertId || p?.id;
        if (!targetAlertId) return;
        setAlerts((prev) =>
          (prev || []).map((a) => (a && a.id === targetAlertId ? { ...a, isResolved: true } : a)),
        );
      } else if (data.type === 'ATTEMPT_DELETED') {
        const p = data.payload || data;
        if (!p || !p.attemptId) return;
        setCandidates((prev) => (prev || []).filter((c) => c && c.attemptId !== p.attemptId));
        setNeedsAttention((prev) => prev.filter((c) => c.attemptId !== p.attemptId));
      } else if (data.type === 'RECOVERY_RESUME_AUTHORIZED') {
        const p = data.payload || data;
        if (!p || !p.attemptId) return;
        setNeedsAttention((prev) => prev.filter((c) => c.attemptId !== p.attemptId));
        setCandidates((prev) =>
          (prev || []).map((c) =>
            c && c.attemptId === p.attemptId
              ? {
                  ...c,
                  status: 'RESUME_AUTHORIZED',
                  isNeedsAttention: false,
                  incidentReasons: [],
                }
              : c,
          ),
        );
      }
    };

    const handleMessageEvent = (event: MessageEvent) => {
      try {
        const parsed = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        handleEventData(parsed);
      } catch (e) {
        // ignore non-json messages
      }
    };

    const scheduleReconnect = () => {
      // Exponential backoff reconnect with 30s maximum cap
      const delay = Math.min(1000 * Math.pow(1.5, retryCount), SSE_RECONNECT_MAX_MS);
      retryCount++;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        connectSse();
      }, delay);
    };

    const connectSse = async () => {
      if (isCancelled) return;
      try {
        // EventSource can't send an Authorization header, so exchange the session
        // for a single-use stream ticket instead of putting the JWT in the URL.
        const { ticket } = await apiClient.request<{ ticket: string }>(
          '/admin/monitoring/stream-ticket',
          { method: 'POST' },
        );
        if (isCancelled) return;

        const sseUrl = buildUrl(
          getApiBaseUrl(),
          `/admin/monitoring/assessments/${assessmentId}/live-stream`,
          { ticket },
        );

        const es = new EventSource(sseUrl);
        eventSourceRef.current = es;

        es.onopen = () => {
          if (isCancelled) {
            es.close();
            return;
          }
          setIsConnected(true);
          retryCount = 0;
        };

        es.onmessage = handleMessageEvent;
        es.addEventListener('CANDIDATE_HEARTBEAT', handleMessageEvent as any);
        es.addEventListener('STATE_TRANSITION', handleMessageEvent as any);
        es.addEventListener('CANDIDATE_DISCONNECTED', handleMessageEvent as any);
        es.addEventListener('ALERT_EMITTED', handleMessageEvent as any);
        es.addEventListener('ALERT_RESOLVED', handleMessageEvent as any);
        es.addEventListener('RECOVERY_RESUME_AUTHORIZED', handleMessageEvent as any);
        es.addEventListener('ATTEMPT_DELETED', handleMessageEvent as any);

        es.onerror = () => {
          if (isCancelled) return;
          setIsConnected(false);
          try {
            es.close();
          } catch (_) {}
          scheduleReconnect();
        };
      } catch (err) {
        if (isCancelled) return;
        setIsConnected(false);
        scheduleReconnect();
      }
    };

    connectSse();

    return () => {
      isCancelled = true;
      clearInterval(flushInterval);
      heartbeatBufferRef.current.clear();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setIsConnected(false);
    };
  }, [assessmentId]);

  // Adaptive background sync: 30s while SSE is connected; when it isn't, poll from
  // 5s and back off on consecutive failures. Each poll is scheduled only after the
  // previous one settles, so slow responses can't pile up.
  useEffect(() => {
    if (!assessmentId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      const delay = isConnected
        ? CONNECTED_SYNC_MS
        : Math.min(FALLBACK_POLL_BASE_MS * Math.pow(2, pollFailuresRef.current), FALLBACK_POLL_MAX_MS);
      timer = setTimeout(async () => {
        await fetchSnapshot(true);
        if (!cancelled) schedule();
      }, delay);
    };
    schedule();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [assessmentId, isConnected, fetchSnapshot]);

  return {
    candidates,
    needsAttention,
    summary,
    alerts,
    systemHealth,
    pagination,
    isLoading,
    isRefetching,
    isConnected,
    refetch: () => fetchSnapshot(false),
  };
}
