import { useEffect, useState, useRef } from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { toast } from 'sonner';

const PING_INTERVAL_MS = 10000; // Ping every 10 seconds

export function useConnectionMonitor() {
  const { setConnectionStatus, setPing, connectionStatus } = useExecutionStore();
  const [wasOffline, setWasOffline] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('ONLINE');
      if (wasOffline) {
        toast.success('Network connection restored.');
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setConnectionStatus('OFFLINE');
      setPing(null);
      if (!wasOffline) {
        toast.error('Network connection lost. Please check your internet.', { duration: 10000 });
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

    // Active pinging
    const pingServer = async () => {
      if (!navigator.onLine) return;
      
      const start = Date.now();
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${baseUrl}/api/v1/health`, {
          method: 'GET', // Changed to GET just in case HEAD is not explicitly handled by NestJS
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (res.ok) {
          const latency = Date.now() - start;
          setPing(latency);
          
          if (useExecutionStore.getState().connectionStatus === 'OFFLINE') {
            handleOnline();
          }
        } else {
          throw new Error('Health check failed');
        }
      } catch (error) {
        setPing(null);
        if (useExecutionStore.getState().connectionStatus === 'ONLINE') {
          handleOffline();
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
  }, [wasOffline, setConnectionStatus, setPing]);

  return { wasOffline };
}
