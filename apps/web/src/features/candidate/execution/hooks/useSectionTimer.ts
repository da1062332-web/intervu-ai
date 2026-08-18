'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { executionService } from '../services/execution.service';

const TICK_INTERVAL_MS = 1000;

// DDOS-001: Bounded retry configuration for section advance
const MAX_SECTION_ADVANCE_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 1000;

/**
 * useSectionTimer
 * ---------------
 * Server-authoritative per-section countdown timer (Feature 6).
 * Only active when `sectionTimingEnabled = true`.
 *
 * When the section timer reaches zero, it automatically calls advanceSection
 * on the backend, locking the current section and activating the next (Feature 8).
 *
 * DDOS-001: Retries are bounded with exponential backoff. Permanent 4xx errors
 * are not retried. The retry loop is cancelled after successful advance or on
 * assessment state change.
 */
export function useSectionTimer(testId: string | undefined) {
  const {
    sectionTimingEnabled,
    sectionRemainingTime,
    setSectionTimer,
    advanceSectionLocally,
    lockedSectionKeys,
    currentSectionIndex,
    testInstance,
    submissionStatus,
  } = useExecutionStore();

  const advancingRef = useRef(false); // Prevent duplicate advance calls
  // DDOS-001: Retry state
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // DDOS-001: Track if we've exhausted retries to stop the timer tick from re-triggering
  const retriesExhaustedRef = useRef(false);

  const attemptAdvance = useCallback(async () => {
    if (!testId) return;
    if (submissionStatus === 'SUCCESS' || submissionStatus === 'SUBMITTING') return;

    try {
      const result = await executionService.advanceSection(testId);

      // Reset retry state on success
      retryCountRef.current = 0;
      retriesExhaustedRef.current = false;

      if (result.isLastSection || result.submitted) {
        return;
      }

      if (result.nextSectionIndex !== null) {
        let updatedInstance = testInstance;
        try {
          const latest = await executionService.getTestInstance(testId);
          if (latest) updatedInstance = latest;
        } catch (e) {
          // fallback
        }

        const newLockedKeys =
          updatedInstance?.sections.slice(0, result.nextSectionIndex).map((s) => s.sectionKey) ?? [];
        advanceSectionLocally(result.nextSectionIndex, newLockedKeys, result.serverTime, updatedInstance ?? undefined);
      }
    } catch (err: any) {
      const status = err?.statusCode || err?.status;

      // DDOS-001: Do not retry permanent 4xx errors
      if (status && status >= 400 && status < 500) {
        console.error('[useSectionTimer] Permanent error advancing section (no retry):', err);
        retriesExhaustedRef.current = true;
        advancingRef.current = false;
        return;
      }

      retryCountRef.current += 1;
      if (retryCountRef.current >= MAX_SECTION_ADVANCE_RETRIES) {
        console.error(
          `[useSectionTimer] Section advance failed after ${MAX_SECTION_ADVANCE_RETRIES} retries. Showing recoverable UI state.`,
          err,
        );
        retriesExhaustedRef.current = true;
        advancingRef.current = false;
        // TODO: surface a user-facing "Section advance failed — please refresh" message
        return;
      }

      // DDOS-001: Exponential backoff
      const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCountRef.current - 1);
      console.warn(
        `[useSectionTimer] Section advance failed (attempt ${retryCountRef.current}/${MAX_SECTION_ADVANCE_RETRIES}), retrying in ${delay}ms`,
        err,
      );
      retryTimeoutRef.current = setTimeout(() => {
        advancingRef.current = false;
        attemptAdvance();
      }, delay);
    }
  }, [testId, submissionStatus, testInstance, advanceSectionLocally]);

  const handleSectionExpiry = useCallback(async () => {
    // DDOS-001: Do not trigger if retries are exhausted
    if (retriesExhaustedRef.current) return;
    if (advancingRef.current) return;

    advancingRef.current = true;
    await attemptAdvance();
    // Note: advancingRef is reset inside attemptAdvance (on success or permanent failure)
    // or via the retry timeout. For transient failures, the timeout callback resets it.
  }, [attemptAdvance]);

  // DDOS-001: Reset retry state when section changes (successful advance happened externally)
  useEffect(() => {
    retryCountRef.current = 0;
    retriesExhaustedRef.current = false;
    advancingRef.current = false;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, [currentSectionIndex]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Only run when section timing is enabled and assessment is active
    if (!sectionTimingEnabled || !testId) return;
    if (sectionRemainingTime <= 0) {
      // Already expired on mount — trigger immediately
      handleSectionExpiry();
      return;
    }

    const interval = setInterval(() => {
      const currentTime = useExecutionStore.getState().sectionRemainingTime;
      if (currentTime <= 1) {
        setSectionTimer(0);
        clearInterval(interval);
        handleSectionExpiry();
      } else {
        setSectionTimer(currentTime - 1);
      }
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
    // Re-run when section changes (currentSectionIndex changes after advance)
  }, [
    sectionTimingEnabled,
    testId,
    currentSectionIndex,
    handleSectionExpiry,
    setSectionTimer,
    sectionRemainingTime,
  ]);
}
