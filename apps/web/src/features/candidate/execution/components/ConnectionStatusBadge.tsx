'use client';

import { useExecutionStore } from '../stores/execution.store';
import { WifiOff, Wifi, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

export function ConnectionStatusBadge() {
  const { connectionStatus, ping } = useExecutionStore();
  const [showRestored, setShowRestored] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (connectionStatus === 'OFFLINE') {
      setWasOffline(true);
      setShowRestored(false);
    } else if (connectionStatus === 'ONLINE' && wasOffline) {
      setShowRestored(true);
      setWasOffline(false);
      const timer = setTimeout(() => setShowRestored(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, wasOffline]);

  // If online, ping is available, and we are not showing the "restored" badge, show the ping badge.
  if (connectionStatus === 'ONLINE' && !showRestored) {
    if (ping !== null) {
      // Color code based on ping
      const isSlow = ping > 500;
      return (
        <Badge
          variant="outline"
          className={`flex items-center gap-1 font-medium shadow-sm border-gray-200 text-gray-600 bg-white`}
        >
          {isSlow ? (
            <Activity className="w-3.5 h-3.5 text-yellow-500" />
          ) : (
            <Wifi className="w-3.5 h-3.5 text-green-500" />
          )}
          <span>{ping}ms</span>
        </Badge>
      );
    }
    return null;
  }

  return (
    <Badge
      variant={connectionStatus === 'OFFLINE' ? 'destructive' : 'default'}
      className={`flex items-center gap-1 font-medium shadow-sm transition-all animate-in fade-in ${
        connectionStatus === 'ONLINE' ? 'bg-green-500 hover:bg-green-600' : ''
      }`}
    >
      {connectionStatus === 'OFFLINE' ? (
        <>
          <WifiOff className='w-3.5 h-3.5' />
          <span>Offline</span>
        </>
      ) : showRestored ? (
        <>
          <Wifi className='w-3.5 h-3.5' />
          <span>Reconnected</span>
        </>
      ) : null}
    </Badge>
  );
}
