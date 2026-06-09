import { useEffect, useState } from 'react';
import { useExecutionStore } from '../stores/execution.store';

export function useConnectionMonitor() {
  const { setConnectionStatus } = useExecutionStore();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('ONLINE');
      if (wasOffline) {
        // Just for local state tracking, we could trigger a toast here
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setConnectionStatus('OFFLINE');
      setWasOffline(true);
    };

    // Initial check
    if (typeof window !== 'undefined') {
      setConnectionStatus(navigator.onLine ? 'ONLINE' : 'OFFLINE');
      if (!navigator.onLine) setWasOffline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, setConnectionStatus]);

  return { wasOffline };
}
