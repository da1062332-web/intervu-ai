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
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';
import { LiveAlert } from '../hooks/useLiveMonitoring';
import { apiClient } from '@/services/api/client';
import { toast } from 'sonner';

interface AlertCenterProps {
  alerts: LiveAlert[];
  onAlertResolved?: (alertId: string) => void;
}

export function AlertCenter({ alerts = [], onAlertResolved }: AlertCenterProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [isExpanded, setIsExpanded] = useState(true);

  const activeAlerts = (alerts || []).filter((a) => a && !a.isResolved);
  const filteredAlerts =
    selectedSeverity === 'ALL'
      ? activeAlerts
      : activeAlerts.filter((a) => a && a.severity === selectedSeverity);

  const handleResolve = async (alertId: string) => {
    try {
      await apiClient.request(`/admin/monitoring/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
      toast.success('Alert resolved');
      onAlertResolved?.(alertId);
    } catch (err) {
      toast.error('Failed to resolve alert');
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'P0':
        return <Badge variant='destructive' className='bg-red-600 font-bold'>P0 PLATFORM</Badge>;
      case 'P1':
        return <Badge variant='destructive' className='bg-rose-500 font-bold'>P1 CRITICAL</Badge>;
      case 'P2':
        return <Badge className='bg-amber-500 text-white font-medium'>P2 WARNING</Badge>;
      case 'P3':
      default:
        return <Badge variant='secondary' className='font-medium'>P3 INFO</Badge>;
    }
  };

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <Card className='border shadow-sm'>
      <CardHeader className='py-3 px-4 flex flex-row items-center justify-between border-b'>
        <div className='flex items-center gap-2'>
          <AlertCircle className='size-4 text-rose-500' />
          <CardTitle className='text-sm font-semibold'>
            Live Incident & Alert Center ({activeAlerts.length})
          </CardTitle>
        </div>

        <div className='flex items-center gap-2'>
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
                  onClick={() => handleResolve(alert.id)}
                  className='h-7 text-xs gap-1 shrink-0'
                >
                  <Check className='size-3 text-emerald-600' />
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
