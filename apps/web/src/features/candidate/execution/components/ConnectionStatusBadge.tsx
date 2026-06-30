'use client';

import { useExecutionStore } from '../stores/execution.store';
import { WifiOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

export function ConnectionStatusBadge() {
  const { connectionStatus } = useExecutionStore();
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

  if (connectionStatus === 'ONLINE' && !showRestored) return null;

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
<<<<<<< HEAD
          <span>Online</span>
=======
          <span>Reconnected</span>
>>>>>>> df114762eb99866ba825edb9aff504802cb730eb
        </>
      ) : null}
    </Badge>
  );
}
