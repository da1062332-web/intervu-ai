'use client';

import { useEffect, useRef } from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { apiClient } from '@/services/api/client';
import { toast } from 'sonner';

const HEARTBEAT_INTERVAL_MS = 15000; // 15 seconds for scale (1000-2000 candidates)

export function useLiveTelemetry(testInstanceId?: string) {
  const lastExtraTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!testInstanceId || testInstanceId.startsWith('demo-')) return;

    const sendHeartbeat = async () => {
      try {
        const state = useExecutionStore.getState();

        const currentSectionKey =
          state.testInstance?.sections?.[state.currentSectionIndex]?.sectionKey ||
          state.testInstance?.sections?.[0]?.sectionKey ||
          'section-1';

        const totalQuestions =
          state.testInstance?.sections?.reduce(
            (acc, sec) => acc + (sec.questions?.length || 0),
            0,
          ) || 0;

        const answeredCount = Object.values(state.answers).filter(
          (a) =>
            a.status === 'ANSWERED' ||
            Boolean(a.selectedOptionId || a.selectedOptionIds?.length || a.textResponse),
        ).length;

        const markedCount = Object.values(state.answers).filter(
          (a) => a.status === 'MARKED_FOR_REVIEW',
        ).length;

        const payload = {
          currentSectionKey,
          currentSectionIndex: state.currentSectionIndex,
          currentQuestionId: state.currentQuestion?.id || '',
          currentQuestionIndex: state.currentQuestionIndex,
          answeredCount,
          totalQuestions,
          markedQuestionsCount: markedCount,
          remainingTimeSeconds: state.remainingTime,
          latencyMs: state.ping || 40,
          networkStatus: state.connectionStatus || 'ONLINE',
          autosaveHealth:
            state.autosaveStatus === 'FAILED'
              ? 'FAILED'
              : state.autosaveStatus === 'SAVING'
                ? 'RETRYING'
                : 'HEALTHY',
          unsyncedAnswersCount: 0,
          // Strikes are server-authoritative — only the proctoring-event
          // endpoint may set them, never the routine heartbeat.
          clientTimestamp: new Date().toISOString(),
        };

        const res = await apiClient.request<any>(`/tests/${testInstanceId}/heartbeat`, {
          method: 'POST',
          body: payload,
          skipErrorToast: true,
        });

        if (res) {
          // Server-authoritative timer expiry and FORCE_SUBMIT enforcement
          if (
            res.directive === 'FORCE_SUBMIT' ||
            (typeof res.remainingTimeSeconds === 'number' && res.remainingTimeSeconds <= 0)
          ) {
            useExecutionStore.setState({ remainingTime: 0 });
            toast.error('Assessment Session Expired', {
              description: 'Your assessment time has expired or submission was enforced by proctor. Finalizing now...',
              duration: 5000,
            });
            try {
              await apiClient.request(`/tests/${testInstanceId}/submit`, {
                method: 'POST',
                query: { autoSubmit: true, allowPartial: true },
                skipErrorToast: true,
              });
            } catch {
              // Ignore already submitted errors
            }
            useExecutionStore.getState().setSubmissionStatus('SUCCESS');
            return;
          }

          // Authoritative timer sync: eliminate client clock drift
          if (typeof res.remainingTimeSeconds === 'number' && res.remainingTimeSeconds > 0) {
            const currentRemaining = useExecutionStore.getState().remainingTime;
            if (Math.abs(currentRemaining - res.remainingTimeSeconds) >= 3) {
              useExecutionStore.setState({ remainingTime: res.remainingTimeSeconds });
            }
          }

          // If admin added extra time
          if (
            res.extraTimeGrantedSeconds &&
            res.extraTimeGrantedSeconds > lastExtraTimeRef.current
          ) {
            const addedMinutes = Math.round(
              (res.extraTimeGrantedSeconds - lastExtraTimeRef.current) / 60,
            );
            lastExtraTimeRef.current = res.extraTimeGrantedSeconds;

            if (addedMinutes > 0) {
              useExecutionStore.setState((s) => ({
                remainingTime: s.remainingTime + addedMinutes * 60,
              }));
              toast.info('Time Extended by Proctor', {
                description: `Proctor has granted an additional ${addedMinutes} minutes for your assessment.`,
                duration: 6000,
              });
            }
          }

          // If proctor authorized resume while candidate is waiting
          if (res.directive === 'RESUME_SESSION' || res.status === 'RESUME_AUTHORIZED') {
            toast.success('Session Resumed by Proctor', {
              description: 'Your assessment session has been successfully restored. You may continue.',
              duration: 5000,
            });
            // Trigger explicit POST handshake to transition state to IN_PROGRESS
            await apiClient.request(`/tests/${testInstanceId}/recovery/resume`, {
              method: 'POST',
              skipErrorToast: true,
            });
          }
        }
      } catch (err) {
        // Non-blocking catch: monitoring failures never disrupt candidate exam flow
      }
    };

    // Initial heartbeat
    sendHeartbeat();

    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [testInstanceId]);
}
