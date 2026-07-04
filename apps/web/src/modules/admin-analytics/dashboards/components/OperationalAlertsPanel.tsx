'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Info, BellRing, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/services/api/client';

export interface AdminAlert {
  id: string;
  type: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: string;
  createdAt: string;
}

export function OperationalAlertsPanel() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.request<AdminAlert[]>('/admin/alerts', {
        method: 'GET',
        skipErrorToast: true,
      });
      setAlerts(data || []);
    } catch (error) {
      console.error('Failed to fetch admin alerts', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const getAlertStyles = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          cardBg: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
          icon: <AlertCircle className='size-5 text-red-500 shrink-0 mt-0.5' />,
        };
      case 'WARNING':
        return {
          cardBg: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
          icon: <AlertTriangle className='size-5 text-amber-500 shrink-0 mt-0.5' />,
        };
      default:
        return {
          cardBg: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',
          icon: <Info className='size-5 text-blue-500 shrink-0 mt-0.5' />,
        };
    }
  };

  return (
    <Card className='glass border border-border shadow-lg'>
      <CardHeader className='flex flex-row items-center justify-between pb-4 border-b border-border/40'>
        <div className='flex items-center gap-2'>
          <BellRing className='size-5 text-primary animate-pulse' />
          <CardTitle className='text-lg font-heading font-semibold text-foreground'>
            System Operations Alerts
          </CardTitle>
        </div>
        <button
          onClick={fetchAlerts}
          className='p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors'
          title='Refresh alerts'
          disabled={loading}
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </CardHeader>
      <CardContent className='pt-6 space-y-4 max-h-[300px] overflow-y-auto'>
        {loading && alerts.length === 0 ? (
          <div className='space-y-3'>
            {[1, 2].map((i) => (
              <div key={i} className='h-16 bg-muted animate-pulse rounded-xl w-full' />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className='text-center py-6 text-sm text-muted-foreground'>
            🎉 All systems healthy. No operational alerts active.
          </div>
        ) : (
          alerts.map((alert) => {
            const styles = getAlertStyles(alert.severity);
            return (
              <div
                key={alert.id}
                className={`flex gap-3 p-4 rounded-xl border ${styles.cardBg} transition-all hover:scale-[1.01] duration-150`}
              >
                {styles.icon}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between gap-4'>
                    <span className='text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-foreground/5 text-foreground/75'>
                      {alert.type.replace('_', ' ')}
                    </span>
                    <span className='text-[10px] text-muted-foreground'>
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className='text-sm mt-1 leading-snug'>{alert.message}</p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
