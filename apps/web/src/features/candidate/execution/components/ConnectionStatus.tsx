'use client';

import { useExecutionStore } from '../stores/execution.store';
import { WifiOff, Wifi, Activity } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

export function ConnectionStatus() {
  const { connectionStatus, isSlowConnection, ping } = useExecutionStore();
  const [showRestored, setShowRestored] = useState(false);
  const prevStatusRef = useRef(connectionStatus);

  useEffect(() => {
    if (prevStatusRef.current === 'OFFLINE' && connectionStatus === 'ONLINE') {
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 4000);
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  if (connectionStatus === 'ONLINE' && !isSlowConnection && !showRestored) {
    return null;
  }

  return (
    <div className='fixed top-2 left-0 w-full z-[100] flex justify-center pointer-events-none px-4'>
      {connectionStatus === 'OFFLINE' ? (
        <div className='bg-red-600 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs sm:text-sm font-semibold pointer-events-auto border border-red-700 animate-in fade-in slide-in-from-top-4'>
          <WifiOff className='w-4 h-4 text-white animate-pulse shrink-0' />
          <span>Connection Lost &bull; All answers are safely saved locally. Do not reload.</span>
        </div>
      ) : showRestored ? (
        <div className='bg-emerald-600 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs sm:text-sm font-semibold pointer-events-auto border border-emerald-700 animate-in fade-in slide-in-from-top-4'>
          <Wifi className='w-4 h-4 text-white shrink-0' />
          <span>Connection Restored &bull; Answers synced to server.</span>
        </div>
      ) : isSlowConnection ? (
        <div className='bg-amber-500 text-amber-950 px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs sm:text-sm font-semibold pointer-events-auto border border-amber-600 animate-in fade-in slide-in-from-top-4'>
          <Activity className='w-4 h-4 text-amber-950 shrink-0' />
          <span>
            Low Internet Connectivity {ping !== null ? `(${ping}ms)` : ''} &bull; Local backup active.
          </span>
        </div>
      ) : null}
    </div>
  );
}
