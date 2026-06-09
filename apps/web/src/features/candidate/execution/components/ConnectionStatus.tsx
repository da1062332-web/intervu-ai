'use client';

import { useExecutionStore } from '../stores/execution.store';
import { useConnectionMonitor } from '../hooks/useConnectionMonitor';
import { WifiOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ConnectionStatus() {
  const { connectionStatus } = useExecutionStore();
  const { wasOffline } = useConnectionMonitor();
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (connectionStatus === 'ONLINE' && showRestored) {
      const timer = setTimeout(() => setShowRestored(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, showRestored]);

  // When connectionStatus changes from OFFLINE to ONLINE, showRestored becomes true.
  // We can track this implicitly because `wasOffline` handles the state inside the hook.
  useEffect(() => {
    if (connectionStatus === 'ONLINE' && wasOffline === false) {
      // Actually we just need to detect transitions. The hook handles it but
      // a simpler way is local state transition tracking
    }
  }, [connectionStatus, wasOffline]);

  // Let's refine:
  useEffect(() => {
    if (connectionStatus === 'ONLINE' && wasOffline) {
      setShowRestored(true);
    }
  }, [connectionStatus, wasOffline]);

  if (connectionStatus === 'ONLINE' && !showRestored) return null;

  return (
    <div className={`fixed top-0 left-0 w-full z-[100] flex justify-center p-2 transition-transform duration-300 transform translate-y-0`}>
      {connectionStatus === 'OFFLINE' ? (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          You are offline. Changes will be saved locally.
        </div>
      ) : showRestored ? (
        <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-4">
          <Wifi className="w-4 h-4" />
          Connection Restored
        </div>
      ) : null}
    </div>
  );
}
