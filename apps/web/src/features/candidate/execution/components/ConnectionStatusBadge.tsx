'use client';

import { useExecutionStore } from '../stores/execution.store';
import { WifiOff, Wifi, Activity } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';

export function ConnectionStatusBadge() {
  const { connectionStatus, isSlowConnection, ping } = useExecutionStore();
  const [showRestored, setShowRestored] = useState(false);
  const prevStatusRef = useRef(connectionStatus);

  useEffect(() => {
    if (prevStatusRef.current === 'OFFLINE' && connectionStatus === 'ONLINE') {
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3500);
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  if (connectionStatus === 'OFFLINE') {
    return (
      <Badge
        variant='destructive'
        className='flex items-center gap-1.5 font-medium shadow-xs bg-red-600 hover:bg-red-700 text-white animate-pulse'
        title='Connection lost. Answers are saved locally.'
      >
        <WifiOff className='w-3.5 h-3.5' />
        <span>Offline</span>
      </Badge>
    );
  }

  if (showRestored) {
    return (
      <Badge
        className='flex items-center gap-1.5 font-medium shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white animate-in fade-in'
        title='Internet restored. Syncing answers.'
      >
        <Wifi className='w-3.5 h-3.5' />
        <span>Reconnected</span>
      </Badge>
    );
  }

  if (isSlowConnection) {
    return (
      <Badge
        variant='outline'
        className='flex items-center gap-1.5 font-medium shadow-xs border-amber-300 bg-amber-50 text-amber-900'
        title='Slow internet connection detected. Local autosave active.'
      >
        <Activity className='w-3.5 h-3.5 text-amber-600 animate-pulse' />
        <span>Slow {ping !== null ? `(${ping}ms)` : ''}</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant='outline'
      className='flex items-center gap-1.5 font-medium shadow-xs border-emerald-200 bg-emerald-50 text-emerald-800'
      title='Internet connection healthy.'
    >
      <Wifi className='w-3.5 h-3.5 text-emerald-600' />
      <span>Online {ping !== null ? `(${ping}ms)` : ''}</span>
    </Badge>
  );
}
