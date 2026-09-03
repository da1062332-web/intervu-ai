'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { billingApi } from '@/services/api/billing.api';
import { notifySuccess, notifyApiError } from '@/services/notifications/toast';
import { AdminBillingHeader } from '@/components/billing/admin-billing-header';
import type { PaymentStatsResponse } from '@intervu-ai/contracts';

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStatsResponse | null>(null);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);
  const [txSearch, setTxSearch] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState('');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setIsPaymentsLoading(true);
      const [txRes, statsRes] = await Promise.all([
        billingApi.adminGetTransactions({ search: txSearch, status: txStatusFilter }),
        billingApi.adminGetPaymentStats(),
      ]);
      setTransactions(txRes.data || []);
      setPaymentStats(statsRes);
    } catch (err) {
      notifyApiError(err, 'Failed to load payments data');
    } finally {
      setIsPaymentsLoading(false);
    }
  };

  const handleManualVerify = async (txId: string) => {
    if (!confirm('Manually mark this transaction as SUCCESS and activate subscriber entitlements?')) return;
    try {
      await billingApi.adminManualVerifyPayment(txId);
      notifySuccess('Payment manually verified & subscription activated!');
      loadPayments();
    } catch (err) {
      notifyApiError(err, 'Failed to verify payment');
    }
  };

  return (
    <div className='space-y-6 animate-fade-in-up'>
      <AdminBillingHeader
        title='Payments & Revenue Audit'
        description='Inspect live Razorpay payment transactions, revenue volumes, success rates, and manual verification triggers.'
        actionButton={
          <Button
            onClick={loadPayments}
            variant='outline'
            className='h-10 px-4 rounded-xl text-xs font-bold gap-1.5'
          >
            <RefreshCw className={`size-3.5 ${isPaymentsLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        }
      />

      {/* Revenue KPI Cards */}
      {paymentStats && (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card className='p-5 rounded-2xl border border-border/80 bg-card'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Total Collected
              </span>
              <DollarSign className='size-5 text-emerald-600' />
            </div>
            <h3 className='text-2xl font-extrabold text-foreground mt-2'>
              ₹{(paymentStats.totalVolumePaise / 100).toLocaleString('en-IN')}
            </h3>
          </Card>

          <Card className='p-5 rounded-2xl border border-border/80 bg-card'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Successful Payments
              </span>
              <CheckCircle2 className='size-5 text-indigo-600' />
            </div>
            <h3 className='text-2xl font-extrabold text-foreground mt-2'>
              {paymentStats.successfulCount}
            </h3>
          </Card>

          <Card className='p-5 rounded-2xl border border-border/80 bg-card'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Pending Transactions
              </span>
              <Clock className='size-5 text-amber-500' />
            </div>
            <h3 className='text-2xl font-extrabold text-foreground mt-2'>
              {paymentStats.pendingCount}
            </h3>
          </Card>

          <Card className='p-5 rounded-2xl border border-border/80 bg-card'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Est. Monthly Run-Rate
              </span>
              <TrendingUp className='size-5 text-purple-600' />
            </div>
            <h3 className='text-2xl font-extrabold text-foreground mt-2'>
              ₹{(paymentStats.mrrEstimatePaise / 100).toLocaleString('en-IN')}
            </h3>
          </Card>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className='flex flex-col sm:flex-row items-center gap-3'>
        <div className='relative flex-1 w-full'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
          <Input
            placeholder='Search by email, candidate name, or payment ID...'
            value={txSearch}
            onChange={(e) => setTxSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadPayments()}
            className='pl-9 h-10 rounded-xl'
          />
        </div>
        <select
          value={txStatusFilter}
          onChange={(e) => setTxStatusFilter(e.target.value)}
          className='h-10 px-3 rounded-xl border border-border/80 bg-background text-xs font-medium'
        >
          <option value=''>All Statuses</option>
          <option value='SUCCESS'>SUCCESS</option>
          <option value='PENDING'>PENDING</option>
          <option value='FAILED'>FAILED</option>
        </select>
        <Button onClick={loadPayments} variant='outline' className='h-10 px-4 rounded-xl text-xs font-bold gap-1.5'>
          <Filter className='size-3.5' /> Filter
        </Button>
      </div>

      {/* Transactions Table */}
      <Card className='rounded-2xl border border-border/80 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-xs'>
            <thead className='bg-muted/50 border-b border-border/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
              <tr>
                <th className='p-4'>Candidate</th>
                <th className='p-4'>Plan</th>
                <th className='p-4'>Amount</th>
                <th className='p-4'>Razorpay Payment ID</th>
                <th className='p-4'>Status</th>
                <th className='p-4'>Date</th>
                <th className='p-4 text-right'>Action</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border/60'>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className='p-8 text-center text-muted-foreground'>
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className='hover:bg-muted/20'>
                    <td className='p-4 font-medium'>
                      <div>{tx.userName || 'Candidate'}</div>
                      <div className='text-[11px] text-muted-foreground'>{tx.userEmail}</div>
                    </td>
                    <td className='p-4 font-bold uppercase text-indigo-600'>{tx.plan}</td>
                    <td className='p-4 font-extrabold text-foreground'>
                      ₹{(tx.amount / 100).toLocaleString('en-IN')}
                    </td>
                    <td className='p-4 font-sans text-xs text-muted-foreground'>
                      {tx.razorpayPaymentId}
                    </td>
                    <td className='p-4'>
                      <Badge
                        variant='outline'
                        className={
                          tx.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }
                      >
                        {tx.status}
                      </Badge>
                    </td>
                    <td className='p-4 text-muted-foreground text-[11px]'>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className='p-4 text-right'>
                      {tx.status === 'PENDING' && (
                        <Button
                          size='sm'
                          onClick={() => handleManualVerify(tx.id)}
                          className='h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold'
                        >
                          Verify & Activate
                        </Button>
                      )}
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
