'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/services/api/client';
import { useSessionStore } from '@/store/session.store';
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
  currentSectionIndex: number;
  currentQuestionId: string;
  currentQuestionIndex: number;
  answeredCount: number;
  totalQuestions: number;
  markedQuestionsCount: number;
  remainingTimeSeconds: number;
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

export function useLiveMonitoring(assessmentId: string, options: UseLiveMonitoringOptions = {}) {
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
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

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Fetch initial or refreshed snapshot
  const fetchSnapshot = useCallback(async (isBackground = false) => {
    if (!assessmentId) return;
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
      if (opts.dateFilter && opts.dateFilter !== 'all') queryParams.set('dateFilter', opts.dateFilter);
      if (opts.startDate) queryParams.set('startDate', opts.startDate);
      if (opts.endDate) queryParams.set('endDate', opts.endDate);

      const res = await apiClient.request<any>(
        `/admin/monitoring/assessments/${assessmentId}/snapshot?${queryParams.toString()}`,
      );

      if (res) {
        const filteredCandidates = (res.candidates || []).filter(
          (c: CandidateItem) =>
            c.candidateRole !== 'ADMIN' &&
            c.candidateRole !== 'PLAN_MANAGER' &&
            !c.candidateEmail?.toLowerCase().includes('admin@intervu.ai'),
        );
        setCandidates(filteredCandidates);
        if (res.summary) setSummary(res.summary);
        if (res.alerts) setAlerts(res.alerts);
        if (res.systemHealth) setSystemHealth(res.systemHealth);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed fetching assessment live snapshot', err);
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
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

    // High-concurrency telemetry buffer: flushes buffered heartbeats once every 1,000ms
    // to maintain a silky smooth 60 FPS UI under 1,000 to 2,000 simultaneous candidates
    const flushInterval = setInterval(() => {
      if (heartbeatBufferRef.current.size === 0) return;
      const updates = new Map(heartbeatBufferRef.current);
      heartbeatBufferRef.current.clear();

      setCandidates((prev) =>
        prev.map((c) => {
          const p = updates.get(c.attemptId);
          if (!p) return c;
          return {
            ...c,
            status: p.status,
            currentSectionKey: p.currentSectionKey ?? c.currentSectionKey,
            currentQuestionIndex: p.currentQuestionIndex ?? c.currentQuestionIndex,
            answeredCount: p.answeredCount ?? c.answeredCount,
            remainingTimeSeconds: p.remainingTimeSeconds ?? c.remainingTimeSeconds,
            latencyMs: p.latencyMs ?? c.latencyMs,
            autosaveHealth: p.autosaveHealth ?? c.autosaveHealth,
            networkStatus: p.networkStatus ?? c.networkStatus,
            isNeedsAttention: p.isNeedsAttention ?? c.isNeedsAttention,
            lastHeartbeatAt: p.lastHeartbeatAt ?? Date.now(),
          };
        }),
      );
    }, 1000);

    const handleEventData = (data: any) => {
      if (!data || data.type === 'PING') return;

      if (data.type === 'CANDIDATE_HEARTBEAT') {
        const p = data.payload;
        if (
          p?.attemptId &&
          p.candidateRole !== 'ADMIN' &&
          p.candidateRole !== 'PLAN_MANAGER'
        ) {
          heartbeatBufferRef.current.set(p.attemptId, p);
        }
        return;
      } else if (data.type === 'STATE_TRANSITION') {
        const p = data.payload;
        if (p?.candidateRole === 'ADMIN' || p?.candidateRole === 'PLAN_MANAGER') return;
        let matched = false;
        setCandidates((prev) =>
          prev.map((c) => {
            if (c.attemptId === p.attemptId) {
              matched = true;
              return {
                ...c,
                status: p.newState,
                isNeedsAttention:
                  p.newState === 'AUTO_SUBMITTED' || p.newState === 'ADMIN_REVIEW'
                    ? true
                    : c.isNeedsAttention,
              };
            }
            return c;
          }),
        );

        // Update tallies only if it matches a monitored candidate
        if (matched) {
          setSummary((s) => ({
            ...s,
            active: p.newState === 'ACTIVE' ? s.active + 1 : Math.max(0, s.active - 1),
            autoSubmitted: p.newState === 'AUTO_SUBMITTED' ? s.autoSubmitted + 1 : s.autoSubmitted,
            submitted: p.newState === 'SUBMITTED' ? s.submitted + 1 : s.submitted,
          }));
        }
      } else if (data.type === 'CANDIDATE_DISCONNECTED') {
        const p = data.payload;
        let matched = false;
        setCandidates((prev) =>
          prev.map((c) => {
            if (c.attemptId === p.attemptId) {
              matched = true;
              return {
                ...c,
                status: 'DISCONNECTED',
                networkStatus: 'OFFLINE',
                isNeedsAttention: true,
                incidentReasons: Array.from(
                  new Set([...c.incidentReasons, `Disconnected (>${p.silentDurationSeconds || 30}s)`]),
                ),
              };
            }
            return c;
          }),
        );
        if (matched) {
          setSummary((s) => ({
            ...s,
            active: Math.max(0, s.active - 1),
            disconnected: s.disconnected + 1,
            needsAttentionCount: s.needsAttentionCount + 1,
          }));
        }
      } else if (data.type === 'ALERT_EMITTED') {
        const alert = data.payload;
        if (alert.candidateRole === 'ADMIN' || alert.candidateRole === 'PLAN_MANAGER') return;
        setAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
        if (alert.severity === 'P0' || alert.severity === 'P1') {
          toast.error(`[${alert.severity}] ${alert.title}`, {
            description: alert.message,
            duration: 8000,
          });
        }
      } else if (data.type === 'ALERT_RESOLVED') {
        setAlerts((prev) =>
          prev.map((a) => (a.id === data.payload.alertId ? { ...a, isResolved: true } : a)),
        );
      } else if (data.type === 'RECOVERY_RESUME_AUTHORIZED') {
        const p = data.payload;
        setCandidates((prev) =>
          prev.map((c) =>
            c.attemptId === p.attemptId
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

    const connectSse = () => {
      if (isCancelled) return;
      try {
        const token =
          useSessionStore.getState().accessToken ||
          localStorage.getItem('token') ||
          '';
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const sseUrl = `${baseUrl}/api/v1/admin/monitoring/assessments/${assessmentId}/live-stream?token=${encodeURIComponent(token)}`;

        const es = new EventSource(sseUrl, { withCredentials: true });
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

        es.onerror = () => {
          if (isCancelled) return;
          setIsConnected(false);
          es.close();

          // Exponential backoff reconnect
          const delay = Math.min(1000 * Math.pow(2, retryCount), 15000);
          retryCount++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSse();
          }, delay);
        };
      } catch (err) {
        if (!isCancelled) setIsConnected(false);
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

  // High-reliability adaptive sync:
  // If SSE is connected, do periodic background sync every 30s.
  // If SSE is reconnecting/disconnected, fallback poll every 5s!
  useEffect(() => {
    if (!assessmentId) return;

    const intervalMs = isConnected ? 30000 : 5000;
    const syncInterval = setInterval(() => {
      fetchSnapshot(true);
    }, intervalMs);

    return () => clearInterval(syncInterval);
  }, [assessmentId, isConnected, fetchSnapshot]);

  return {
    candidates,
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
