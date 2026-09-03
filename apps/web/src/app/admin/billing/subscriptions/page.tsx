'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
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

export default function CandidateSubscriptionsPage() {
  const [candidateSubs, setCandidateSubs] = useState<any[]>([]);
  const [isSubsLoading, setIsSubsLoading] = useState(false);
  const [subSearch, setSubSearch] = useState('');
  const [subPlanFilter, setSubPlanFilter] = useState('');

  // Candidate action modals
  const [selectedUserForAction, setSelectedUserForAction] = useState<any | null>(null);
  const [actionModalType, setActionModalType] = useState<'changePlan' | 'extend' | 'override' | null>(null);
  const [targetNewPlan, setTargetNewPlan] = useState('PRO');
  const [extendDays, setExtendDays] = useState(30);
  const [overrideBonusRounds, setOverrideBonusRounds] = useState(5);
  const [overrideReason, setOverrideReason] = useState('Promotional Bonus');

  useEffect(() => {
    loadCandidateSubscriptions();
  }, []);

  const loadCandidateSubscriptions = async () => {
    try {
      setIsSubsLoading(true);
      const data = await billingApi.adminGetCandidateSubscriptions({
        search: subSearch,
        plan: subPlanFilter,
      });
      setCandidateSubs(data.data || []);
    } catch (err) {
      notifyApiError(err, 'Failed to load subscriptions');
    } finally {
      setIsSubsLoading(false);
    }
  };

  const handleChangeCandidatePlan = async () => {
    if (!selectedUserForAction) return;
    try {
      await billingApi.adminChangeCandidatePlan(selectedUserForAction.userId, targetNewPlan);
      notifySuccess(`Plan changed to ${targetNewPlan} for ${selectedUserForAction.email}!`);
      setActionModalType(null);
      loadCandidateSubscriptions();
    } catch (err) {
      notifyApiError(err, 'Failed to change plan');
    }
  };

  const handleExtendSubscription = async () => {
    if (!selectedUserForAction) return;
    try {
      await billingApi.adminExtendSubscription(selectedUserForAction.userId, Number(extendDays));
      notifySuccess(`Subscription extended by ${extendDays} days for ${selectedUserForAction.email}!`);
      setActionModalType(null);
      loadCandidateSubscriptions();
    } catch (err) {
      notifyApiError(err, 'Failed to extend subscription');
    }
  };

  const handleGrantQuotaBonus = async () => {
    if (!selectedUserForAction) return;
    try {
      await billingApi.adminGrantQuotaOverride(selectedUserForAction.userId, {
        featureKey: 'monthly_rounds_limit',
        overrideValue: { bonusRounds: Number(overrideBonusRounds) },
        reason: overrideReason,
      });
      notifySuccess(`Granted +${overrideBonusRounds} bonus rounds to ${selectedUserForAction.email}!`);
      setActionModalType(null);
      loadCandidateSubscriptions();
    } catch (err) {
      notifyApiError(err, 'Failed to grant bonus rounds');
    }
  };

  return (
    <div className='space-y-6 animate-fade-in-up'>
      <AdminBillingHeader
        title='Candidate Subscriptions & Quota Manager'
        description='Manage candidate subscription plans, extend validity periods, inspect monthly test usage, and grant custom bonus test allowances.'
        actionButton={
          <Button
            onClick={loadCandidateSubscriptions}
            variant='outline'
            className='h-10 px-4 rounded-xl text-xs font-bold gap-1.5'
          >
            <RefreshCw className={`size-3.5 ${isSubsLoading ? 'animate-spin' : ''}`} />
            Refresh Subscriptions
          </Button>
        }
      />

      {/* Search & Filter Bar */}
      <div className='flex flex-col sm:flex-row items-center gap-3'>
        <div className='relative flex-1 w-full'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
          <Input
            placeholder='Search candidates by email or name...'
            value={subSearch}
            onChange={(e) => setSubSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadCandidateSubscriptions()}
            className='pl-9 h-10 rounded-xl'
          />
        </div>
        <select
          value={subPlanFilter}
          onChange={(e) => setSubPlanFilter(e.target.value)}
          className='h-10 px-3 rounded-xl border border-border/80 bg-background text-xs font-medium'
        >
          <option value=''>All Plans</option>
          <option value='FREE'>FREE</option>
          <option value='PRO'>PRO</option>
          <option value='TEAMS'>TEAMS</option>
        </select>
        <Button onClick={loadCandidateSubscriptions} variant='outline' className='h-10 px-4 rounded-xl text-xs font-bold gap-1.5'>
          <Filter className='size-3.5' /> Filter
        </Button>
      </div>

      {/* Subscriptions Table */}
      <Card className='rounded-2xl border border-border/80 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-xs'>
            <thead className='bg-muted/50 border-b border-border/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
              <tr>
                <th className='p-4'>Candidate</th>
                <th className='p-4'>Current Tier</th>
                <th className='p-4'>Status</th>
                <th className='p-4'>Monthly Usage</th>
                <th className='p-4'>Expiration Date</th>
                <th className='p-4 text-right'>Manager Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border/60'>
              {candidateSubs.length === 0 ? (
                <tr>
                  <td colSpan={6} className='p-8 text-center text-muted-foreground'>
                    No candidate subscriptions found.
                  </td>
                </tr>
              ) : (
                candidateSubs.map((sub) => (
                  <tr key={sub.userId} className='hover:bg-muted/20'>
                    <td className='p-4 font-medium'>
                      <div>{sub.fullName || 'Candidate'}</div>
                      <div className='text-[11px] text-muted-foreground'>{sub.email}</div>
                    </td>
                    <td className='p-4'>
                      <Badge
                        variant='outline'
                        className={
                          sub.plan === 'PRO'
                            ? 'bg-indigo-600 text-white border-transparent font-bold'
                            : sub.plan === 'TEAMS'
                            ? 'bg-purple-600 text-white border-transparent font-bold'
                            : 'bg-slate-100 text-slate-800 border-slate-300 font-bold'
                        }
                      >
                        {sub.plan}
                      </Badge>
                    </td>
                    <td className='p-4'>
                      <span className='inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600'>
                        <span className='size-1.5 rounded-full bg-emerald-500' />
                        {sub.status}
                      </span>
                    </td>
                    <td className='p-4 font-semibold'>
                      {sub.roundsLimit === null
                        ? 'Unlimited'
                        : `${sub.roundsUsed} / ${sub.roundsLimit} tests`}
                    </td>
                    <td className='p-4 text-muted-foreground text-[11px]'>
                      {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'No Expiry (Free)'}
                    </td>
                    <td className='p-4 text-right space-x-1.5'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => {
                          setSelectedUserForAction(sub);
                          setActionModalType('changePlan');
                        }}
                        className='h-7 px-2.5 rounded-lg text-[11px] font-bold'
                      >
                        Change Plan
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => {
                          setSelectedUserForAction(sub);
                          setActionModalType('extend');
                        }}
                        className='h-7 px-2.5 rounded-lg text-[11px] font-bold'
                      >
                        + Extend
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => {
                          setSelectedUserForAction(sub);
                          setActionModalType('override');
                        }}
                        className='h-7 px-2.5 rounded-lg text-indigo-600 border-indigo-200 hover:bg-indigo-50 text-[11px] font-bold'
                      >
                        + Bonus Quota
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CANDIDATE ACTION MODALS */}
      {actionModalType && selectedUserForAction && (
        <div className='fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex min-h-screen items-center justify-center p-4 sm:p-6'>
          <div className='relative w-full max-w-md rounded-2xl bg-white dark:bg-card border border-border p-6 shadow-2xl space-y-4 my-auto max-h-[88vh] overflow-y-auto'>
            <h3 className='text-lg font-bold text-foreground'>
              {actionModalType === 'changePlan' && `Change Plan: ${selectedUserForAction.email}`}
              {actionModalType === 'extend' && `Extend Validity: ${selectedUserForAction.email}`}
              {actionModalType === 'override' && `Grant Bonus Quota: ${selectedUserForAction.email}`}
            </h3>

            {actionModalType === 'changePlan' && (
              <div className='space-y-3 text-xs'>
                <label className='block font-bold text-muted-foreground'>Select New Tier</label>
                <select
                  value={targetNewPlan}
                  onChange={(e) => setTargetNewPlan(e.target.value)}
                  className='w-full h-10 px-3 rounded-xl border border-border bg-background font-bold'
                >
                  <option value='FREE'>FREE</option>
                  <option value='PRO'>PRO</option>
                  <option value='TEAMS'>TEAMS</option>
                </select>
              </div>
            )}

            {actionModalType === 'extend' && (
              <div className='space-y-3 text-xs'>
                <label className='block font-bold text-muted-foreground'>Days to Extend</label>
                <Input
                  type='number'
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  placeholder='30'
                />
              </div>
            )}

            {actionModalType === 'override' && (
              <div className='space-y-3 text-xs'>
                <div>
                  <label className='block font-bold text-muted-foreground mb-1'>Bonus Practice Rounds</label>
                  <Input
                    type='number'
                    value={overrideBonusRounds}
                    onChange={(e) => setOverrideBonusRounds(Number(e.target.value))}
                    placeholder='5'
                  />
                </div>
                <div>
                  <label className='block font-bold text-muted-foreground mb-1'>Reason / Campaign Note</label>
                  <Input
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder='e.g. Scholarship award'
                  />
                </div>
              </div>
            )}

            <div className='flex items-center justify-end gap-2 pt-4 border-t border-border/60'>
              <Button variant='outline' onClick={() => setActionModalType(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (actionModalType === 'changePlan') handleChangeCandidatePlan();
                  if (actionModalType === 'extend') handleExtendSubscription();
                  if (actionModalType === 'override') handleGrantQuotaBonus();
                }}
                className='bg-indigo-600 hover:bg-indigo-700 text-white font-bold'
              >
                Confirm Action
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
