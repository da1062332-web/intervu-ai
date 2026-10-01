import { useEffect, useState, useRef } from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { apiClient } from '@/services/api/client';
import { toast } from 'sonner';

const PING_INTERVAL_MS = 10000; // Ping every 10 seconds
const SLOW_PING_THRESHOLD_MS = 500; // > 500ms latency is considered slow connection
const SLOW_TOAST_THROTTLE_MS = 60000; // Notify at most once per minute for slow connection

export function useConnectionMonitor() {
  const { setConnectionStatus, setPing, setIsSlowConnection, connectionStatus } =
    useExecutionStore();
  const [wasOffline, setWasOffline] = useState(false);
  const wasOfflineRef = useRef(false);
  const lastSlowToastTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('ONLINE');
      if (wasOfflineRef.current) {
        toast.success('Internet Connection Restored', {
          id: 'online-status-toast',
          description: 'Back online! Syncing your offline answers to the server.',
          duration: 4000,
        });
        wasOfflineRef.current = false;
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setConnectionStatus('OFFLINE');
      setPing(null);
      setIsSlowConnection(false);
      if (!wasOfflineRef.current) {
        toast.error('Network Connection Lost', {
          id: 'offline-status-toast',
          description:
            'You are offline. Do not close or reload this tab. All answers are safely saved locally.',
          duration: 10000,
        });
        wasOfflineRef.current = true;
        setWasOffline(true);
      }
    };

    if (typeof window !== 'undefined') {
      if (!navigator.onLine) {
        handleOffline();
      }
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Active pinging with latency tracking and timeout
    const pingServer = async () => {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        handleOffline();
        return;
      }

      const start = Date.now();
      try {
        await apiClient.request('/health', {
          method: 'GET',
          skipAuth: true,
          skipErrorToast: true,
        });

        const latency = Math.max(1, Date.now() - start);
        setPing(latency);

        // Check for slow / low internet connectivity
        const isSlowPing = latency > SLOW_PING_THRESHOLD_MS;
        const navConn = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
        const isSlowType =
          navConn && (navConn.effectiveType === '2g' || navConn.effectiveType === 'slow-2g');
        const isSlow = isSlowPing || isSlowType;

        setIsSlowConnection(isSlow);

        if (isSlow) {
          const now = Date.now();
          if (now - lastSlowToastTimeRef.current > SLOW_TOAST_THROTTLE_MS) {
            lastSlowToastTimeRef.current = now;
            toast.warning('Low Internet Connectivity', {
              id: 'slow-connection-warning',
              description: `High latency detected (${latency}ms). Your answers are automatically backed up locally.`,
              duration: 6000,
            });
          }
        }

        if (useExecutionStore.getState().connectionStatus === 'OFFLINE') {
          handleOnline();
        }
      } catch (error) {
        const navConn = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
        if (typeof navigator !== 'undefined' && navigator.onLine && navConn?.rtt) {
          setPing(navConn.rtt);
        } else {
          setPing(null);
          setIsSlowConnection(false);
          if (useExecutionStore.getState().connectionStatus === 'ONLINE' && typeof navigator !== 'undefined' && !navigator.onLine) {
            handleOffline();
          }
        }
      }
    };

    // Initial ping
    pingServer();

    // Set up polling interval
    timeoutRef.current = setInterval(pingServer, PING_INTERVAL_MS);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timeoutRef.current) clearInterval(timeoutRef.current);
    };
  }, [setConnectionStatus, setPing, setIsSlowConnection]);

  return { wasOffline };
}
