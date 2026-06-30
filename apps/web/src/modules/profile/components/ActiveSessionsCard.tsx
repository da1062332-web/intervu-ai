'use client';

import { Monitor, Smartphone, Globe, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useSessions } from '@/hooks/use-sessions';
import { useManageSessions } from '@/hooks/use-manage-sessions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ActiveSessionsCard() {
  const { data: sessions, isLoading, error } = useSessions();
  const { deleteSession, isDeleting, deleteAllSessions, isDeletingAll } = useManageSessions();

  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm animate-pulse">
        <div className="h-6 w-1/3 bg-muted rounded mb-4"></div>
        <div className="space-y-4">
          <div className="h-16 bg-muted/50 rounded-xl"></div>
          <div className="h-16 bg-muted/50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !sessions) {
    return (
      <div className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 shadow-sm">
        <div className="flex items-center gap-3 text-destructive">
          <AlertTriangle className="size-5" />
          <h3 className="font-medium">Failed to load active sessions</h3>
        </div>
      </div>
    );
  }

  // Usually the current session has `isCurrent` true.
  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  const getDeviceIcon = (userAgent: string | undefined) => {
    const ua = (userAgent || '').toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return Smartphone;
    }
    return Monitor;
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground">Active Sessions</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage and secure your account access.</p>
        </div>
        
        {otherSessions.length > 0 && (
          <Button 
            variant="outline" 
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30 shrink-0"
            onClick={() => deleteAllSessions()}
            disabled={isDeletingAll}
          >
            <ShieldAlert className="mr-2 size-4" />
            Logout Other Devices
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm divide-y divide-border overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No active sessions found.
          </div>
        ) : (
          sessions.map((session) => {
            const DeviceIcon = getDeviceIcon(session.userAgent || session.device);
            const isCurrent = session.isCurrent;
            
            const createdAt = session.createdAt 
              ? new Date(session.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
              : 'Unknown';
              
            const expiresAt = session.expiresAt 
              ? new Date(session.expiresAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
              : 'Unknown';

            return (
              <div key={session.id} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-5 ${isCurrent ? 'bg-primary/5' : 'hover:bg-muted/20'} transition-colors`}>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted border border-border/50">
                  <DeviceIcon className="size-5 text-muted-foreground" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground truncate">
                      {session.device || 'Unknown Device'}
                    </p>
                    {isCurrent && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase tracking-wider">
                        Current Session
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 truncate max-w-[200px]" title={session.userAgent}>
                      <Globe className="size-3.5" />
                      {session.userAgent || 'Unknown Browser'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      IP: {session.ip || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      Created: {createdAt}
                    </span>
                  </div>
                </div>

                {!isCurrent && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 mt-2 sm:mt-0"
                    onClick={() => deleteSession(session.id)}
                    disabled={isDeleting || isDeletingAll}
                  >
                    Logout
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
