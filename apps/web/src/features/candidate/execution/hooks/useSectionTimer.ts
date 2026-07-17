'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { executionService } from '../services/execution.service';

const TICK_INTERVAL_MS = 1000;

/**
 * useSectionTimer
 * ---------------
 * Server-authoritative per-section countdown timer (Feature 6).
 * Only active when `sectionTimingEnabled = true`.
 *
 * When the section timer reaches zero, it automatically calls advanceSection
 * on the backend, locking the current section and activating the next (Feature 8).
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

  const handleSectionExpiry = useCallback(async () => {
    if (!testId || advancingRef.current) return;
    if (submissionStatus === 'SUCCESS' || submissionStatus === 'SUBMITTING') return;

    advancingRef.current = true;
    try {
      const result = await executionService.advanceSection(testId);

      if (result.isLastSection || result.submitted) {
        // Submission is triggered by the backend; do nothing more here.
        // useSubmission hook handles redirect on status change.
        return;
      }

      if (result.nextSectionIndex !== null) {
        // Compute locked keys: all sections from 0..nextSectionIndex-1
        const newLockedKeys = testInstance?.sections
          .slice(0, result.nextSectionIndex)
          .map((s) => s.sectionKey) ?? [];

        advanceSectionLocally(result.nextSectionIndex, newLockedKeys, result.serverTime);
      }
    } catch (err) {
      console.error('[useSectionTimer] Failed to advance section:', err);
      // Allow retry on next tick or let the user manually proceed
    } finally {
      advancingRef.current = false;
    }
  }, [testId, submissionStatus, testInstance, advanceSectionLocally]);

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
  }, [sectionTimingEnabled, testId, currentSectionIndex, handleSectionExpiry, setSectionTimer, sectionRemainingTime]);
}
