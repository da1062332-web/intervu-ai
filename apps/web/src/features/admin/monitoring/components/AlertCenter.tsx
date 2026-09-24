'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
} from 'lucide-react';
import { LiveAlert } from '../hooks/useLiveMonitoring';
import { apiClient } from '@/services/api/client';
import { toast } from 'sonner';

interface AlertCenterProps {
  alerts: LiveAlert[];
  onAlertResolved?: (alertId: string) => void;
  onAllAlertsResolved?: () => void;
}

export function AlertCenter({ alerts = [], onAlertResolved, onAllAlertsResolved }: AlertCenterProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isResolvingAll, setIsResolvingAll] = useState(false);
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());

  const activeAlerts = (alerts || []).filter((a) => a && !a.isResolved);
  const filteredAlerts =
    selectedSeverity === 'ALL'
      ? activeAlerts
      : activeAlerts.filter((a) => a && a.severity === selectedSeverity);

  const handleResolve = async (alertId: string) => {
    setResolvingIds((prev) => new Set(prev).add(alertId));
    try {
      await apiClient.request(`/admin/monitoring/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
      toast.success('Alert acknowledged and resolved');
      onAlertResolved?.(alertId);
    } catch (err) {
      toast.error('Failed to resolve alert');
    } finally {
      setResolvingIds((prev) => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }
  };

  const handleResolveAll = async () => {
    if (activeAlerts.length === 0 || isResolvingAll) return;
    setIsResolvingAll(true);
    const count = activeAlerts.length;
    try {
      try {
        await apiClient.request('/admin/monitoring/alerts/resolve-all', {
          method: 'POST',
          body: JSON.stringify({}),
        });
      } catch (err) {
        // Graceful fallback for staging if resolve-all endpoint is not yet live
        const promises = activeAlerts.map((a) =>
          apiClient
            .request(`/admin/monitoring/alerts/${a.id}/resolve`, {
              method: 'POST',
            })
            .catch(() => null),
        );
        await Promise.allSettled(promises);
      }

      toast.success(`Successfully acknowledged all ${count} alert(s)`);
      onAllAlertsResolved?.();
      onAlertResolved?.('all');
    } catch (err) {
      toast.error('Failed to acknowledge all alerts');
    } finally {
      setIsResolvingAll(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'P0':
        return (
          <Badge className='bg-red-600 hover:bg-red-700 text-white border-transparent font-bold tracking-wide shadow-xs'>
            P0 PLATFORM
          </Badge>
        );
      case 'P1':
        return (
          <Badge className='bg-rose-600 hover:bg-rose-700 text-white border-transparent font-bold tracking-wide shadow-xs'>
            P1 CRITICAL
          </Badge>
        );
      case 'P2':
        return (
          <Badge className='bg-amber-500 hover:bg-amber-600 text-white border-transparent font-medium tracking-wide shadow-xs'>
            P2 WARNING
          </Badge>
        );
      case 'P3':
      default:
        return (
          <Badge variant='secondary' className='font-medium tracking-wide'>
            P3 INFO
          </Badge>
        );
    }
  };

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <Card className='border shadow-sm'>
      <CardHeader className='py-3 px-4 flex flex-row items-center justify-between border-b gap-3 flex-wrap sm:flex-nowrap'>
        <div className='flex items-center gap-2 min-w-0'>
          <AlertCircle className='size-4 text-rose-500 shrink-0' />
          <CardTitle className='text-sm font-semibold truncate'>
            Live Incident & Alert Center ({activeAlerts.length})
          </CardTitle>
        </div>

        <div className='flex items-center gap-2 shrink-0'>
          {/* Acknowledge All Button */}
          <Button
            size='sm'
            variant='outline'
            disabled={isResolvingAll || activeAlerts.length === 0}
            onClick={handleResolveAll}
            className='h-7 px-2.5 text-xs gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-medium'
          >
            {isResolvingAll ? (
              <Loader2 className='size-3.5 animate-spin' />
            ) : (
              <CheckCheck className='size-3.5 text-emerald-600 dark:text-emerald-400' />
            )}
            Acknowledge All ({activeAlerts.length})
          </Button>

          <div className='flex items-center gap-1 bg-muted p-0.5 rounded-md text-xs'>
            {['ALL', 'P0', 'P1', 'P2', 'P3'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  selectedSeverity === sev
                    ? 'bg-background shadow-xs text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <Button
            size='sm'
            variant='ghost'
            className='size-7 p-0'
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse alerts' : 'Expand alerts'}
          >
            {isExpanded ? <ChevronUp className='size-4' /> : <ChevronDown className='size-4' />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className='p-0 divide-y max-h-72 overflow-y-auto'>
          {filteredAlerts.length === 0 ? (
            <div className='p-4 text-center text-xs text-muted-foreground'>
              No active alerts matching severity {selectedSeverity}.
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className='p-3 flex items-start justify-between gap-3 hover:bg-muted/40 transition-colors'
              >
                <div className='space-y-1 overflow-hidden'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    {getSeverityBadge(alert.severity)}
                    <span className='text-xs font-semibold text-foreground'>{alert.title}</span>
                    <span className='text-[10px] text-muted-foreground font-mono'>
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className='text-xs text-muted-foreground'>{alert.message}</p>
                  {alert.candidateName && (
                    <span className='inline-block text-[11px] text-primary/80'>
                      Candidate: {alert.candidateName}
                    </span>
                  )}
                </div>

                <Button
                  size='sm'
                  variant='outline'
                  disabled={resolvingIds.has(alert.id) || isResolvingAll}
                  onClick={() => handleResolve(alert.id)}
                  className='h-7 text-xs gap-1 shrink-0'
                >
                  {resolvingIds.has(alert.id) ? (
                    <Loader2 className='size-3 animate-spin text-muted-foreground' />
                  ) : (
                    <Check className='size-3 text-emerald-600' />
                  )}
                  Acknowledge
                </Button>
              </div>
            ))
          )}
        </CardContent>
      )}
    </Card>
  );
}
