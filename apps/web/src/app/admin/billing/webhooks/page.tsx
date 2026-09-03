'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  RefreshCw,
  Zap,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { billingApi } from '@/services/api/billing.api';
import { notifyApiError, notifySuccess } from '@/services/notifications/toast';
import { AdminBillingHeader } from '@/components/billing/admin-billing-header';

export default function WebhookLogsPage() {
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [isWebhooksLoading, setIsWebhooksLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    loadWebhookLogs();
  }, []);

  const loadWebhookLogs = async () => {
    try {
      setIsWebhooksLoading(true);
      const data = await billingApi.adminGetWebhookLogs();
      setWebhookLogs(data.data || []);
    } catch (err) {
      notifyApiError(err, 'Failed to load webhook logs');
    } finally {
      setIsWebhooksLoading(false);
    }
  };

  const handleSimulateWebhook = async () => {
    try {
      setIsSimulating(true);
      await billingApi.adminSimulateWebhook();
      notifySuccess('Test webhook event generated and recorded');
      await loadWebhookLogs();
    } catch (err) {
      notifyApiError(err, 'Failed to simulate test webhook');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className='space-y-6 animate-fade-in-up'>
      <AdminBillingHeader
        title='Razorpay Webhook Audit Logs'
        description='Real-time audit log of processed and deduplicated Razorpay webhook delivery events.'
        actionButton={
          <div className='flex items-center gap-2'>
            <Button
              onClick={handleSimulateWebhook}
              disabled={isSimulating}
              className='h-10 px-4 rounded-xl text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white'
            >
              <Zap className={`size-3.5 ${isSimulating ? 'animate-bounce' : ''}`} />
              Simulate Test Webhook
            </Button>
            <Button
              onClick={loadWebhookLogs}
              variant='outline'
              className='h-10 px-4 rounded-xl text-xs font-bold gap-1.5'
            >
              <RefreshCw className={`size-3.5 ${isWebhooksLoading ? 'animate-spin' : ''}`} />
              Refresh Logs
            </Button>
          </div>
        }
      />

      {/* Webhook Configuration Guide Card */}
      <div className='p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-foreground flex items-start gap-3'>
        <Info className='size-4 text-indigo-600 shrink-0 mt-0.5' />
        <div className='space-y-1'>
          <div className='font-bold text-foreground'>Webhook Ingestion Endpoint</div>
          <div className='text-muted-foreground'>
            To receive live events from Razorpay in production, configure this URL in your{' '}
            <span className='font-semibold text-foreground'>Razorpay Dashboard &gt; Settings &gt; Webhooks</span>:
          </div>
          <code className='inline-block px-2 py-1 rounded bg-background border border-border/80 font-sans font-semibold text-indigo-600 dark:text-indigo-400'>
            https://&lt;your-domain&gt;/api/v1/webhooks/razorpay
          </code>
        </div>
      </div>

      <Card className='rounded-2xl border border-border/80 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-xs'>
            <thead className='bg-muted/50 border-b border-border/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
              <tr>
                <th className='p-4'>Event ID</th>
                <th className='p-4'>Event Type</th>
                <th className='p-4'>Received Timestamp</th>
                <th className='p-4'>Status</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border/60 font-sans'>
              {webhookLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className='p-8 text-center text-muted-foreground font-sans'>
                    No webhook events recorded yet.
                  </td>
                </tr>
              ) : (
                webhookLogs.map((log) => (
                  <tr key={log.id} className='hover:bg-muted/20'>
                    <td className='p-4 text-indigo-600 font-bold'>{log.eventId}</td>
                    <td className='p-4 font-sans font-semibold'>{log.eventType}</td>
                    <td className='p-4 text-muted-foreground text-[11px]'>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className='p-4 font-sans'>
                      <Badge className='bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'>
                        PROCESSED
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
