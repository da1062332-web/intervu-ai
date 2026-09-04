'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, Check, Gift, Users, Award, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { referralsApi } from '@/services/api/referrals.api';
import { useSubscriptionStore } from '@/store/subscription.store';
import { notifySuccess, notifyApiError } from '@/services/notifications/toast';

export function CandidateReferralCard() {
  const queryClient = useQueryClient();
  const checkSubscription = useSubscriptionStore((state) => state.checkSubscription);
  const loadEntitlements = useSubscriptionStore((state) => state.loadEntitlements);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await referralsApi.getCandidateReferralStatus();
      setStatus(data);
    } catch {
      // Silently fail if referral system not active
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const copyLink = () => {
    if (!status?.referralLink) return;
    navigator.clipboard.writeText(status.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    try {
      const result = await referralsApi.redeemCode(redeemCode.trim().toUpperCase());
      if (result.success) {
        notifySuccess(result.message || 'Code redeemed successfully!');
        setRedeemCode('');
        await Promise.all([
          load(),
          checkSubscription(),
          loadEntitlements(),
        ]);
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ['candidate-dashboard-modular'] }),
          queryClient.refetchQueries({ queryKey: ['candidate-dashboard-metrics'] }),
          queryClient.refetchQueries({ queryKey: ['candidate-dashboard-overview'] }),
          queryClient.refetchQueries({ queryKey: ['candidate-enrollments'] }),
          queryClient.refetchQueries({ queryKey: ['public-tests'] }),
          queryClient.refetchQueries({ queryKey: ['candidate', 'tests'] }),
        ]);
      }
    } catch (err) {
      notifyApiError(err);
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border border-border/80 shadow-sm rounded-2xl animate-pulse">
        <CardContent className="h-44 p-6" />
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border/80 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2 text-base font-bold">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Gift className="w-4 h-4" />
            </div>
            Referral Program & Rewards
          </CardTitle>
          <Badge variant="outline" className="text-[11px] font-semibold bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/20">
            Earn Bonus Tests
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Stats Row */}
        {status && (
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Total Referred',
                value: status.totalReferrals ?? 0,
                icon: Users,
                color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
              },
              {
                label: 'Rewarded',
                value: status.rewardedReferrals ?? 0,
                icon: Award,
                color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
              },
              {
                label: 'Pending',
                value: status.pendingReferrals ?? 0,
                icon: RefreshCw,
                color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-muted/30 border border-border/60 rounded-xl p-3 text-center transition-all hover:bg-muted/50"
              >
                <div className={`w-7 h-7 rounded-lg mx-auto mb-1.5 flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <p className="text-foreground font-extrabold text-xl tracking-tight">{s.value}</p>
                <p className="text-muted-foreground text-[11px] font-semibold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Personal Referral Link / Code */}
        {status?.referralLink ? (
          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Your Personal Referral Link
              </span>
              {status.personalCode && (
                <span className="text-xs text-muted-foreground">
                  Code: <code className="font-mono font-bold text-purple-600 dark:text-purple-400">{status.personalCode}</code>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background border border-border rounded-xl px-3 py-2 overflow-hidden shadow-inner">
                <p className="font-mono text-xs text-foreground truncate">{status.referralLink}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={copyLink}
                className="h-9 px-3 text-xs font-bold rounded-xl border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 shrink-0 gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Share this link with peers. When they sign up and take an assessment, you both unlock bonus assessment rounds!
            </p>
          </div>
        ) : (
          <div className="text-center py-2 text-xs text-muted-foreground">
            No active peer referral campaign at the moment.
          </div>
        )}

        {/* Redeem Code Input */}
        <div className="pt-2 border-t border-border/60">
          <label className="text-xs font-bold text-foreground block mb-1.5">
            Redeem a Company or Peer Referral Code
          </label>
          <div className="flex items-center gap-2">
            <Input
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-digit code (e.g. BR534D46)"
              className="font-mono tracking-widest uppercase h-10 rounded-xl flex-1 text-xs"
              maxLength={16}
              onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
            />
            <Button
              size="sm"
              onClick={handleRedeem}
              disabled={redeeming || !redeemCode.trim()}
              className="h-10 px-4 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shrink-0 shadow-sm gap-1"
            >
              {redeeming ? 'Redeeming...' : 'Redeem Code'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Recent events */}
        {status?.events && status.events.length > 0 && (
          <div className="pt-2 border-t border-border/60 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Recent Referrals ({status.events.length})
            </p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {status.events.slice(0, 5).map((ev: any) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between bg-muted/20 border border-border/60 rounded-xl px-3 py-2 text-xs"
                >
                  <span className="text-muted-foreground text-[11px]">
                    Referred on {new Date(ev.createdAt).toLocaleDateString()}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      ev.status === 'REWARDED'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : ev.status === 'QUALIFIED'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {ev.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
