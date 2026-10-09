'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, Check, Gift, Users, Award, RefreshCw, Sparkles, ArrowRight, Share2, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { referralsApi } from '@/services/api/referrals.api';
import { useSubscriptionStore } from '@/store/subscription.store';
import { notifySuccess, notifyApiError } from '@/services/notifications/toast';

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.301-.15-1.782-.88-2.059-.98-.276-.1-.477-.15-.678.15-.2.301-.778.98-.954 1.181-.176.2-.351.226-.653.075s-1.272-.469-2.423-1.496c-.896-.799-1.501-1.786-1.677-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.2-.301.301-.502.101-.201.05-.377-.025-.527s-.678-1.635-.929-2.239c-.245-.588-.494-.508-.678-.518-.176-.009-.377-.01-.578-.01-.201 0-.527.075-.803.377s-1.054 1.03-1.054 2.512 1.079 2.914 1.23 3.115c.15.201 2.124 3.243 5.145 4.548.718.311 1.279.497 1.716.636.722.23 1.379.197 1.9.12.58-.088 1.782-.728 2.033-1.431.251-.703.251-1.306.176-1.431-.075-.126-.276-.201-.577-.352zM12.04 2c-5.523 0-10 4.477-10 10 0 1.765.46 3.486 1.332 5.006L2 22l5.132-1.346C8.614 21.492 10.297 22 12.04 22c5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 18.273c-1.57 0-3.106-.42-4.444-1.217l-.319-.189-3.298.865.88-3.214-.208-.331c-.878-1.396-1.341-3.023-1.341-4.687 0-4.562 3.711-8.273 8.273-8.273 4.562 0 8.273 3.711 8.273 8.273 0 4.562-3.711 8.273-8.273 8.273z" />
    </svg>
  );
}

function LinkedInIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
    </svg>
  );
}

function TwitterXIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TelegramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

export function CandidateReferralCard() {
  const queryClient = useQueryClient();
  const checkSubscription = useSubscriptionStore((state) => state.checkSubscription);
  const loadEntitlements = useSubscriptionStore((state) => state.loadEntitlements);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }
  }, []);

  const shareCampaignTitle = 'Skillitrix AI Interview & Assessment Referral';
  const shareCampaignMessage =
    'Join me on Skillitrix! Practice AI-powered mock interviews and assessments. Sign up using my referral link to unlock bonus assessment rounds:';

  const effectiveReferralLink = useMemo(() => {
    let domain = 'https://app.skillitrix.com';
    if (typeof window !== 'undefined' && window.location.origin) {
      domain = window.location.origin;
    }

    const code = status?.personalCode;
    return code ? `${domain}/signup?ref=${encodeURIComponent(code)}` : `${domain}/signup`;
  }, [status?.personalCode]);

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
    const link = effectiveReferralLink;
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    notifySuccess('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    const link = effectiveReferralLink;
    if (!link) return;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareCampaignTitle,
          text: shareCampaignMessage,
          url: link,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          copyLink();
        }
      }
    } else {
      copyLink();
    }
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
    <Card className="bg-card border border-border/80 shadow-sm rounded-[24px] overflow-hidden">
      <CardHeader className="pb-4 pt-6 px-6 sm:px-7 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider mb-1">
              GROWTH NETWORK
            </span>
            <CardTitle className="text-foreground text-xl sm:text-2xl font-bold tracking-tight">
              Referral Program & Rewards
            </CardTitle>
            <p className="text-xs text-muted-foreground font-normal">
              Share your link to unlock fast-track rewards and premium analytics.
            </p>
          </div>

          <Button
            size="sm"
            className="rounded-xl font-bold text-xs h-9 px-4 bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Award className="w-4 h-4" />
            <span>Earn bonus tests</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-7 space-y-6">
        {/* Stats Row */}
        {status && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {[
              {
                label: 'TOTAL REFERRED',
                value: status.totalReferrals ?? 0,
                desc: 'Invited candidates',
              },
              {
                label: 'REWARDED',
                value: status.rewardedReferrals ?? 0,
                desc: 'Tests unlocked',
              },
              {
                label: 'PENDING',
                value: status.pendingReferrals ?? 0,
                desc: 'Awaiting signup',
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-muted/20 border border-border/60 rounded-2xl p-4 transition-all hover:bg-muted/30"
              >
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">{s.label}</p>
                <p className="text-foreground font-black text-2xl tracking-tight my-1">{s.value}</p>
                <p className="text-muted-foreground/80 text-xs font-normal">{s.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Personal Referral Link / Code */}
        {status?.referralLink || effectiveReferralLink ? (
          <div className="p-5 rounded-2xl bg-muted/20 border border-border/60 space-y-4">
            <span className="text-xs font-bold text-foreground block">
              Personal Referral Link
            </span>

            <div className="flex items-center gap-2.5">
              <div className="flex-1 bg-background border border-border/70 rounded-xl px-3.5 py-2.5 overflow-hidden shadow-inner">
                <p className="font-mono text-xs text-foreground truncate">{effectiveReferralLink}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={copyLink}
                className="h-10 px-4 text-xs font-bold rounded-xl border-border/80 hover:bg-muted text-foreground shrink-0 gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Copy Link</span>
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground font-normal">
              Share this campaign link with peers. When they sign up and take an assessment, you both unlock bonus assessment rounds!
            </p>

            {/* Campaign Share Quick Actions */}
            <div className="pt-3 border-t border-border/40 space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareCampaignMessage} ${effectiveReferralLink}`)}`,
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted/30 hover:bg-muted text-foreground border border-border/60 transition-all"
                  title="Share on WhatsApp"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(effectiveReferralLink)}`,
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted/30 hover:bg-muted text-foreground border border-border/60 transition-all"
                  title="Share on LinkedIn"
                >
                  <LinkedInIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>LinkedIn</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareCampaignMessage)}&url=${encodeURIComponent(effectiveReferralLink)}`,
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted/30 hover:bg-muted text-foreground border border-border/60 transition-all"
                  title="Share on X (Twitter)"
                >
                  <TwitterXIcon className="w-3.5 h-3.5 shrink-0 text-foreground" />
                  <span>X (Twitter)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `https://t.me/share/url?url=${encodeURIComponent(effectiveReferralLink)}&text=${encodeURIComponent(shareCampaignMessage)}`,
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted/30 hover:bg-muted text-foreground border border-border/60 transition-all"
                  title="Share on Telegram"
                >
                  <TelegramIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Telegram</span>
                </button>

                {canNativeShare ? (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted/30 hover:bg-muted text-foreground border border-border/60 transition-all"
                    title="Share via device options"
                  >
                    <Share2 className="w-3.5 h-3.5 shrink-0" />
                    <span>More...</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        `mailto:?subject=${encodeURIComponent(shareCampaignTitle)}&body=${encodeURIComponent(`${shareCampaignMessage}\n\n${effectiveReferralLink}`)}`,
                        '_self'
                      )
                    }
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted/30 hover:bg-muted text-foreground border border-border/60 transition-all"
                    title="Share via Email"
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span>Email</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-xs text-muted-foreground">
            No active peer referral campaign at the moment.
          </div>
        )}

        {/* Redeem Code Input */}
        <div className="p-5 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
          <div>
            <label className="text-xs font-bold text-foreground block">
              Redeem a Company or Peer Referral Code
            </label>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">
              Apply an institutional partner voucher or classmate-provided token
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Input
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              placeholder="ENTER YOUR REFERRAL CODE"
              className="font-mono tracking-wider uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal h-10 rounded-xl flex-1 text-xs bg-background border-border/70"
              maxLength={16}
              onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
            />
            <Button
              size="sm"
              onClick={handleRedeem}
              disabled={redeeming || !redeemCode.trim()}
              className="h-10 px-5 text-xs font-bold rounded-xl bg-sky-400 hover:bg-sky-500 text-slate-950 shrink-0 shadow-sm transition-all"
            >
              {redeeming ? 'Redeeming...' : 'Redeem Code'}
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
