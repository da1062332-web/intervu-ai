import { useEffect, useCallback, useRef } from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { executionService } from '../services/execution.service';

interface QueuedOperation {
  id: string;
  type: 'SAVE_ANSWER';
  payload: {
    testId: string;
    questionId: string;
    answer: string;
    timeSpentSeconds: number;
    isMarkedForReview: boolean;
  };
  timestamp: number;
}

const DB_NAME = 'SkillitriXOfflineDB';
const STORE_NAME = 'syncQueue';

export function useOfflineRecovery() {
  const { connectionStatus, setConnectionStatus } = useExecutionStore();
  // DATA-001 / CON-004: Prevent concurrent replay loops
  const isReplayingRef = useRef(false);

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  };

  /**
   * DATA-001: Queue an offline operation to IndexedDB.
   * The operation is persisted BEFORE any network attempt so no answers are lost.
   */
  const queueOperation = useCallback(
    async (type: 'SAVE_ANSWER', payload: QueuedOperation['payload']) => {
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const op: QueuedOperation = {
          id: crypto.randomUUID(),
          type,
          payload,
          timestamp: Date.now(),
        };

        store.add(op);

        return new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (e) {
        console.error('[OfflineRecovery] Failed to queue offline operation', e);
      }
    },
    [],
  );

  /**
   * DATA-001: Replay queued offline operations.
   * Each operation is sent to the backend individually.
   * An operation is ONLY removed from the queue AFTER the backend confirms success.
   * Failed operations remain in the queue for the next reconnect attempt.
   *
   * CON-004: Uses isReplayingRef to prevent concurrent replay loops.
   */
  const replayQueue = useCallback(async () => {
    // CON-004: Prevent concurrent replays
    if (isReplayingRef.current) {
      return;
    }
    isReplayingRef.current = true;

    try {
      const db = await openDB();

      // Read all pending operations
      const operations: QueuedOperation[] = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      if (operations.length === 0) return;

      console.log(`[OfflineRecovery] Replaying ${operations.length} offline operation(s)...`);

      // Process operations sequentially in timestamp order
      const sorted = operations.sort((a, b) => a.timestamp - b.timestamp);

      for (const op of sorted) {
        try {
          if (op.type === 'SAVE_ANSWER') {
            // DATA-001: Actually call the backend API
            await executionService.saveAnswer(op.payload.testId, {
              questionId: op.payload.questionId,
              answer: op.payload.answer,
              timeSpentSeconds: op.payload.timeSpentSeconds,
              isMarkedForReview: op.payload.isMarkedForReview,
            });

            // DATA-001: Only delete AFTER confirmed backend success
            await new Promise<void>((resolve, reject) => {
              const deleteTx = db.transaction(STORE_NAME, 'readwrite');
              deleteTx.objectStore(STORE_NAME).delete(op.id);
              deleteTx.oncomplete = () => resolve();
              deleteTx.onerror = () => reject(deleteTx.error);
            });

            console.log(`[OfflineRecovery] Synced and removed operation ${op.id}`);
          }
        } catch (err: any) {
          // DATA-001: On failure, check HTTP status (including Axios response status)
          const status = err?.statusCode || err?.status || err?.response?.status;
          const isConflictOrSubmitted =
            status === 409 ||
            String(err?.message || '').includes('409') ||
            String(err?.response?.data?.message || '')
              .toLowerCase()
              .includes('already');

          if ((status && status >= 400 && status < 500) || isConflictOrSubmitted) {
            console.warn(
              `[OfflineRecovery] Permanent error for operation ${op.id} (status ${status}), removing from queue`,
              err,
            );
            // Permanent 4xx / 409 — remove from IndexedDB to avoid endless replay
            await new Promise<void>((resolve) => {
              const deleteTx = db.transaction(STORE_NAME, 'readwrite');
              deleteTx.objectStore(STORE_NAME).delete(op.id);
              deleteTx.oncomplete = () => resolve();
              deleteTx.onerror = () => resolve();
            });
          } else {
            console.error(
              `[OfflineRecovery] Transient error for operation ${op.id}, keeping in queue for retry`,
              err,
            );
            // Transient error — leave in queue, break this replay cycle
            break;
          }
        }
      }
    } catch (e) {
      console.error('[OfflineRecovery] Failed to replay offline queue', e);
    } finally {
      isReplayingRef.current = false;
    }
  }, []);

  // Listen to connectionStatus changes from the store (which is driven by useConnectionMonitor)
  useEffect(() => {
    if (connectionStatus === 'ONLINE') {
      replayQueue();
    }
  }, [connectionStatus, replayQueue]);

  // Keep native event listeners as a fallback
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('ONLINE');
      replayQueue();
    };

    const handleOffline = () => {
      setConnectionStatus('OFFLINE');
    };

    // Initial check
    if (typeof window !== 'undefined') {
      if (navigator.onLine) {
        setConnectionStatus('ONLINE');
        // Initial replay is handled by the first useEffect since default state is ONLINE
      } else {
        setConnectionStatus('OFFLINE');
      }
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setConnectionStatus, replayQueue]);

  return { queueOperation, replayQueue };
}
