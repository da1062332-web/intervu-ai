import { useEffect, useCallback } from 'react';
import { useExecutionStore } from '../stores/execution.store';

interface QueuedOperation {
  id: string;
  type: 'SAVE_ANSWER';
  payload: any;
  timestamp: number;
}

const DB_NAME = 'IntervuOfflineDB';
const STORE_NAME = 'syncQueue';

export function useOfflineRecovery() {
  const { connectionStatus, setConnectionStatus } = useExecutionStore();

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

  const queueOperation = useCallback(async (type: 'SAVE_ANSWER', payload: any) => {
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
      console.error('Failed to queue offline operation', e);
    }
  }, []);

  const replayQueue = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = async () => {
        const operations: QueuedOperation[] = request.result;
        if (operations.length > 0) {
          console.log(`Replaying ${operations.length} offline operations...`);
          // Replay operations sequentially
          for (const op of operations.sort((a, b) => a.timestamp - b.timestamp)) {
            try {
              // In a real app, call the actual API
              // await api.saveAnswer(op.payload);
              
              // Remove from queue after success
              const deleteTx = db.transaction(STORE_NAME, 'readwrite');
              deleteTx.objectStore(STORE_NAME).delete(op.id);
            } catch (err) {
              console.error('Failed to replay operation', op, err);
            }
          }
        }
      };
    } catch (e) {
      console.error('Failed to replay offline queue', e);
    }
  }, []);

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
        replayQueue();
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
