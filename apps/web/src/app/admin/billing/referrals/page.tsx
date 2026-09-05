'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  RefreshCw,
  Gift,
  Users,
  Zap,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Code2,
  AlertCircle,
  Play,
  Pause,
  Search,
  Filter,
  Clock,
  Sparkles,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  Info,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AdminBillingHeader } from '@/components/billing/admin-billing-header';
import { billingApi } from '@/services/api/billing.api';
import { referralsApi } from '@/services/api/referrals.api';
import { notifySuccess, notifyApiError } from '@/services/notifications/toast';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function prettyJson(val: any): string {
  try {
    if (typeof val === 'string') return val;
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

function safeParseJson(str: string): any {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function formatRewardSummary(rewardConfig: any): string {
  if (!rewardConfig) return 'No reward set';
  if (rewardConfig.featureKey === 'allowed_assessments') {
    const val = rewardConfig.overrideValue;
    const list = Array.isArray(val) ? val : val?.assessments || [];
    const targetName = rewardConfig.reason?.replace('Assigned Access: ', '') || list.join(', ') || 'Specific Assessment';
    const attempts = val?.attemptsPerExam ? ` (${val.attemptsPerExam} Att)` : '';
    const bonus = rewardConfig.bonusRounds ? ` +${rewardConfig.bonusRounds} Round` : '';
    return `🎯 ${targetName}${attempts}${bonus}`;
  }
  const rounds =
    rewardConfig.overrideValue?.bonusRounds ??
    (typeof rewardConfig.overrideValue === 'number' ? rewardConfig.overrideValue : null);
  if (rounds !== null && rounds !== undefined) {
    const days = rewardConfig.expiresInDays ? ` (${rewardConfig.expiresInDays}d)` : '';
    return `+${rounds} Assessment${rounds > 1 ? 's' : ''}${days}`;
  }
  return rewardConfig.reason || 'Custom Reward';
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview KPI Cards
// ─────────────────────────────────────────────────────────────────────────────
function OverviewStats({ stats, loading }: { stats: any; loading: boolean }) {
  const cards = [
    {
      label: 'Total Campaigns',
      value: stats?.totalCampaigns ?? 0,
      icon: Gift,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
    },
    {
      label: 'Active Campaigns',
      value: stats?.activeCampaigns ?? 0,
      icon: Zap,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    },
    {
      label: 'Total Redemptions',
      value: stats?.totalRedemptions ?? 0,
      icon: Code2,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    },
    {
      label: 'Referrals Rewarded',
      value: stats?.totalRewarded ?? 0,
      icon: Users,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card
          key={c.label}
          className="bg-card border border-border/80 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${c.iconBg} shrink-0`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {loading ? '—' : c.value}
              </p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5 truncate">
                {c.label}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Campaign Form Dialog (Create / Edit)
// ─────────────────────────────────────────────────────────────────────────────
const PRESET_REWARDS = [
  {
    label: '+1 Assessment (30 Days)',
    config: {
      featureKey: 'monthly_rounds_limit',
      overrideValue: { bonusRounds: 1 },
      expiresInDays: 30,
      reason: 'Referral 1-assessment bonus',
    },
  },
  {
    label: '+2 Assessments (60 Days)',
    config: {
      featureKey: 'monthly_rounds_limit',
      overrideValue: { bonusRounds: 2 },
      expiresInDays: 60,
      reason: 'Referral 2-assessments bonus',
    },
  },
  {
    label: '+5 Assessments (Unlimited Validity)',
    config: {
      featureKey: 'monthly_rounds_limit',
      overrideValue: { bonusRounds: 5 },
      expiresInDays: null,
      reason: 'Referral 5-assessments bonus pack',
    },
  },
];

interface CampaignFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  existing?: any;
}

function CampaignFormDialog({ open, onClose, onSave, existing }: CampaignFormDialogProps) {
  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [type, setType] = useState<'COMPANY' | 'CANDIDATE'>(existing?.type ?? 'COMPANY');
  const [availableAssessments, setAvailableAssessments] = useState<any[]>([]);
  const [rewardMode, setRewardMode] = useState<'ROUNDS' | 'SPECIFIC_ASSESSMENT'>('ROUNDS');
  const [selectedAssessmentCode, setSelectedAssessmentCode] = useState('');
  const [assignedAttempts, setAssignedAttempts] = useState('1');
  const [includeBonusRound, setIncludeBonusRound] = useState(true);
  const [assignedExpiryDays, setAssignedExpiryDays] = useState('30');
  const [customCode, setCustomCode] = useState('');

  const [selectedRefereePreset, setSelectedRefereePreset] = useState<string | null>(
    existing ? null : PRESET_REWARDS[0].label,
  );
  const [selectedReferrerPreset, setSelectedReferrerPreset] = useState<string | null>(
    existing ? null : PRESET_REWARDS[1].label,
  );

  const [referrerRewardMode, setReferrerRewardMode] = useState<'ROUNDS' | 'SPECIFIC_ASSESSMENT'>('ROUNDS');
  const [referrerSelectedAssessmentCode, setReferrerSelectedAssessmentCode] = useState('');
  const [referrerAssignedAttempts, setReferrerAssignedAttempts] = useState('1');
  const [referrerIncludeBonusRound, setReferrerIncludeBonusRound] = useState(true);
  const [referrerAssignedExpiryDays, setReferrerAssignedExpiryDays] = useState('30');

  const [refereeRewardJson, setRefereeRewardJson] = useState(
    existing?.refereeRewardConfig
      ? prettyJson(existing.refereeRewardConfig)
      : prettyJson(PRESET_REWARDS[0].config),
  );
  const [referrerRewardJson, setReferrerRewardJson] = useState(
    existing?.referrerRewardConfig
      ? prettyJson(existing.referrerRewardConfig)
      : prettyJson(PRESET_REWARDS[1].config),
  );
  const [eligibilityJson, setEligibilityJson] = useState(
    existing?.eligibilityConfig
      ? prettyJson(existing.eligibilityConfig)
      : prettyJson({ requiresSubscription: false, maxRedemptionsPerUser: 1, allowSelfReferral: false }),
  );
  const [totalLimit, setTotalLimit] = useState<string>(
    existing?.totalRedemptionLimit?.toString() ?? '',
  );
  const [startsAt, setStartsAt] = useState(existing?.startsAt?.slice(0, 16) ?? '');
  const [endsAt, setEndsAt] = useState(existing?.endsAt?.slice(0, 16) ?? '');
  const [showAdvancedJson, setShowAdvancedJson] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    billingApi
      .adminGetAvailableAssessments()
      .then((data) => {
        setAvailableAssessments(data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!existing) {
      setSelectedRefereePreset(PRESET_REWARDS[0].label);
      setSelectedReferrerPreset(PRESET_REWARDS[1].label);
      return;
    }

    // Referee Reward Config parsing
    if (existing.refereeRewardConfig?.featureKey === 'allowed_assessments') {
      setRewardMode('SPECIFIC_ASSESSMENT');
      setSelectedRefereePreset(null);
      const val = existing.refereeRewardConfig.overrideValue;
      const list = Array.isArray(val) ? val : val?.assessments || [];
      if (list.length > 0) setSelectedAssessmentCode(list[0]);
      if (val?.attemptsPerExam) setAssignedAttempts(String(val.attemptsPerExam));
      if (existing.refereeRewardConfig.expiresInDays) {
        setAssignedExpiryDays(String(existing.refereeRewardConfig.expiresInDays));
      }
      setIncludeBonusRound(existing.refereeRewardConfig.bonusRounds !== 0);
    } else if (existing.refereeRewardConfig?.featureKey === 'monthly_rounds_limit') {
      setRewardMode('ROUNDS');
      const match = PRESET_REWARDS.find(
        (p) =>
          p.config.overrideValue.bonusRounds === existing.refereeRewardConfig?.overrideValue?.bonusRounds &&
          p.config.expiresInDays === existing.refereeRewardConfig?.expiresInDays,
      );
      setSelectedRefereePreset(match ? match.label : null);
    }

    // Referrer Reward Config parsing
    if (existing.referrerRewardConfig?.featureKey === 'allowed_assessments') {
      setReferrerRewardMode('SPECIFIC_ASSESSMENT');
      setSelectedReferrerPreset(null);
      const val = existing.referrerRewardConfig.overrideValue;
      const list = Array.isArray(val) ? val : val?.assessments || [];
      if (list.length > 0) setReferrerSelectedAssessmentCode(list[0]);
      if (val?.attemptsPerExam) setReferrerAssignedAttempts(String(val.attemptsPerExam));
      if (existing.referrerRewardConfig.expiresInDays) {
        setReferrerAssignedExpiryDays(String(existing.referrerRewardConfig.expiresInDays));
      }
      setReferrerIncludeBonusRound(existing.referrerRewardConfig.bonusRounds !== 0);
    } else if (existing.referrerRewardConfig?.featureKey === 'monthly_rounds_limit') {
      setReferrerRewardMode('ROUNDS');
      const match = PRESET_REWARDS.find(
        (p) =>
          p.config.overrideValue.bonusRounds === existing.referrerRewardConfig?.overrideValue?.bonusRounds &&
          p.config.expiresInDays === existing.referrerRewardConfig?.expiresInDays,
      );
      setSelectedReferrerPreset(match ? match.label : null);
    }
  }, [existing]);

  const applyPreset = (preset: typeof PRESET_REWARDS[0], target: 'referee' | 'referrer') => {
    if (target === 'referee') {
      setRefereeRewardJson(prettyJson(preset.config));
      setSelectedRefereePreset(preset.label);
      setRewardMode('ROUNDS');
    } else {
      setReferrerRewardJson(prettyJson(preset.config));
      setSelectedReferrerPreset(preset.label);
      setReferrerRewardMode('ROUNDS');
    }
  };

  const applySpecificAssessment = (
    codeOrId: string,
    attempts: string,
    bonus: boolean,
    days: string,
    target: 'referee' | 'referrer' = 'referee',
  ) => {
    const chosen = availableAssessments.find((a) => a.code === codeOrId || a.id === codeOrId);
    const code = chosen?.code || chosen?.id || codeOrId;
    const assessmentName = chosen?.name || code;
    const cfg = {
      featureKey: 'allowed_assessments',
      overrideValue: {
        assessments: [code],
        attemptsPerExam: Number(attempts) || 1,
      },
      bonusRounds: bonus ? 1 : 0,
      expiresInDays: days ? Number(days) : null,
      reason: `Assigned Access: ${assessmentName}`,
    };
    if (target === 'referee') {
      setRefereeRewardJson(prettyJson(cfg));
      setSelectedRefereePreset(null);
    } else {
      setReferrerRewardJson(prettyJson(cfg));
      setSelectedReferrerPreset(null);
    }
  };

  const validate = () => {
    const errs: string[] = [];
    if (!name.trim()) errs.push('Campaign name is required');
    if (!safeParseJson(refereeRewardJson)) errs.push('Referee Reward Config is not valid JSON');
    if (type === 'CANDIDATE' && !safeParseJson(referrerRewardJson)) {
      errs.push('Referrer Reward Config is not valid JSON');
    }
    if (!safeParseJson(eligibilityJson)) errs.push('Eligibility Config is not valid JSON');
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    setErrors([]);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        refereeRewardConfig: safeParseJson(refereeRewardJson),
        referrerRewardConfig: type === 'CANDIDATE' ? safeParseJson(referrerRewardJson) : {},
        eligibilityConfig: safeParseJson(eligibilityJson),
        totalRedemptionLimit: totalLimit ? Number(totalLimit) : null,
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      };
      if (existing?.id) {
        await referralsApi.adminUpdateCampaign(existing.id, payload);
        notifySuccess('Campaign updated successfully');
      } else {
        const created = await referralsApi.adminCreateCampaign(payload);
        if (customCode.trim()) {
          try {
            await referralsApi.adminGenerateCode(created.id, {
              code: customCode.trim().toUpperCase(),
              maxUses: totalLimit ? Number(totalLimit) : undefined,
            });
            notifySuccess(`Campaign created with custom code: ${customCode.trim().toUpperCase()}`);
          } catch (codeErr) {
            notifyApiError(codeErr);
          }
        } else {
          notifySuccess('Campaign created successfully');
        }
      }
      onSave();
    } catch (err) {
      notifyApiError(err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-card border border-border p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto text-foreground">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {existing ? 'Edit Referral Campaign' : 'Create Referral Campaign'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure reward rules, quotas, and limitations dynamically.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            ✕
          </button>
        </div>

        {errors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 space-y-1">
            {errors.map((e, i) => (
              <p key={i} className="text-destructive text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {e}
              </p>
            ))}
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* Campaign Basics */}
          <div className="space-y-3">
            <div>
              <label className="font-bold text-foreground block mb-1">Campaign Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Campus Drive Welcome Bonus 2025"
                className="h-10 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1">Description (Optional)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description for internal campaign tracking..."
                className="h-18 rounded-xl resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-foreground block mb-1">Campaign Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background font-semibold text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="COMPANY">Company Campaign (Admin to Candidates)</option>
                  <option value="CANDIDATE">Candidate Peer Campaign (A refers B)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Total Redemption Limit</label>
                <Input
                  type="number"
                  value={totalLimit}
                  onChange={(e) => setTotalLimit(e.target.value)}
                  placeholder="Leave blank for unlimited"
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
            {/* Custom Referral Code Input */}
            {!existing && (
              <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground block text-xs">
                    Custom Referral Code (Optional)
                  </label>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">
                    Vanity Code
                  </span>
                </div>
                <div className="relative">
                  <Input
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                    placeholder="e.g. CAMPUS2025, TCSNQT25, WELCOMEFREE (leave blank for random)"
                    className="h-10 rounded-xl font-mono font-bold tracking-widest uppercase pl-9 bg-background"
                    maxLength={30}
                  />
                  <Code2 className="w-4 h-4 text-purple-600 dark:text-purple-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Specify an easy-to-remember custom code for candidates, or leave blank to automatically generate an 8-character code.
                </p>
              </div>
            )}
          </div>

          {/* Reward Strategy Selector */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Candidate Reward Strategy *
              </label>
            </div>

            {/* 2 Big Visual Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card 1: General Rounds */}
              <div
                onClick={() => {
                  setRewardMode('ROUNDS');
                  applyPreset(PRESET_REWARDS[0], 'referee');
                }}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  rewardMode === 'ROUNDS'
                    ? 'border-purple-600 bg-purple-500/10 shadow-sm ring-2 ring-purple-500/20'
                    : 'border-border bg-card hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rewardStrategy"
                    checked={rewardMode === 'ROUNDS'}
                    onChange={() => {}}
                    className="text-purple-600 focus:ring-purple-500 size-4"
                  />
                  <span className="font-bold text-foreground text-xs">🎁 General Assessment Quota</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 pl-6">
                  Candidate receives test attempt rounds usable across any assessment in the platform.
                </p>
              </div>

              {/* Card 2: Specific Assessment */}
              <div
                onClick={() => {
                  setRewardMode('SPECIFIC_ASSESSMENT');
                  const first = selectedAssessmentCode || availableAssessments[0]?.code || availableAssessments[0]?.id || '';
                  if (first) {
                    setSelectedAssessmentCode(first);
                    applySpecificAssessment(first, assignedAttempts, includeBonusRound, assignedExpiryDays, 'referee');
                  }
                }}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  rewardMode === 'SPECIFIC_ASSESSMENT'
                    ? 'border-purple-600 bg-purple-500/10 shadow-sm ring-2 ring-purple-500/20'
                    : 'border-border bg-card hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rewardStrategy"
                    checked={rewardMode === 'SPECIFIC_ASSESSMENT'}
                    onChange={() => {}}
                    className="text-purple-600 focus:ring-purple-500 size-4"
                  />
                  <span className="font-bold text-foreground text-xs">🎯 Specific Assigned Assessment</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 pl-6">
                  Directly unlock access to a designated test blueprint (e.g. TCS NQT, Cognizant, Infosys).
                </p>
              </div>
            </div>

            {/* Option A: General Bonus Tests */}
            {rewardMode === 'ROUNDS' && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <p className="text-[11px] text-muted-foreground font-semibold">
                  Choose a preset or configure custom bonus rounds:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRESET_REWARDS.map((p) => {
                    const isSelected = rewardMode === 'ROUNDS' && selectedRefereePreset === p.label;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => applyPreset(p, 'referee')}
                        className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-purple-600 bg-purple-500/15 ring-2 ring-purple-500/30 text-purple-700 dark:text-purple-300 shadow-sm font-bold'
                            : 'border-border bg-card hover:border-purple-500 hover:bg-purple-500/5 text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{p.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {isSelected ? 'Selected' : 'Click to apply'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Option B: Specific Assigned Assessment */}
            {rewardMode === 'SPECIFIC_ASSESSMENT' && (
              <div className="space-y-3 pt-2 border-t border-border/60">
                <div>
                  <label className="font-bold text-foreground block mb-1">
                    Select Target Assessment Blueprint *
                  </label>
                  <select
                    value={selectedAssessmentCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setSelectedAssessmentCode(code);
                      applySpecificAssessment(code, assignedAttempts, includeBonusRound, assignedExpiryDays, 'referee');
                    }}
                    className="w-full h-11 px-3 rounded-xl border-2 border-purple-500/50 bg-background font-bold text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                  >
                    <option value="">-- Choose an Assessment to Unlock --</option>
                    {availableAssessments.map((a) => (
                      <option key={a.id} value={a.code || a.id}>
                        {a.name} ({a.code || a.id}) {a.durationMinutes ? `• ${a.durationMinutes}m` : ''} {a.role ? `[${a.role}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-foreground block mb-1">Max Attempts Allowed</label>
                    <Input
                      type="number"
                      min="1"
                      value={assignedAttempts}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAssignedAttempts(val);
                        applySpecificAssessment(selectedAssessmentCode, val, includeBonusRound, assignedExpiryDays, 'referee');
                      }}
                      className="h-9 rounded-xl text-xs font-semibold"
                      placeholder="e.g. 1"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-foreground block mb-1">Validity (Days)</label>
                    <Input
                      type="number"
                      min="1"
                      value={assignedExpiryDays}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAssignedExpiryDays(val);
                        applySpecificAssessment(selectedAssessmentCode, assignedAttempts, includeBonusRound, val, 'referee');
                      }}
                      className="h-9 rounded-xl text-xs font-semibold"
                      placeholder="e.g. 30 (blank = never)"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-foreground font-semibold">
                  <input
                    type="checkbox"
                    checked={includeBonusRound}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setIncludeBonusRound(val);
                      applySpecificAssessment(selectedAssessmentCode, assignedAttempts, val, assignedExpiryDays, 'referee');
                    }}
                    className="rounded text-purple-600 focus:ring-purple-500 size-4"
                  />
                  <span>Also grant 1 assessment attempt quota (recommended so candidates can start right away)</span>
                </label>
              </div>
            )}
          </div>

          {/* Candidate-to-Candidate Referrer Reward */}
          {type === 'CANDIDATE' && (
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-foreground flex items-center gap-1.5 text-xs sm:text-sm">
                  <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Referrer Reward Strategy (Candidate who shares code) *
                </label>
              </div>

              {/* 2 Big Visual Selection Cards for Referrer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Card 1: General Rounds */}
                <div
                  onClick={() => {
                    setReferrerRewardMode('ROUNDS');
                    applyPreset(PRESET_REWARDS[1], 'referrer');
                  }}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    referrerRewardMode === 'ROUNDS'
                      ? 'border-purple-600 bg-purple-500/10 shadow-sm ring-2 ring-purple-500/20'
                      : 'border-border bg-card hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="referrerRewardStrategy"
                      checked={referrerRewardMode === 'ROUNDS'}
                      onChange={() => {}}
                      className="text-purple-600 focus:ring-purple-500 size-4"
                    />
                    <span className="font-bold text-foreground text-xs">🎁 General Assessment Quota</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 pl-6">
                    Referrer receives bonus test round quota usable for any assessment.
                  </p>
                </div>

                {/* Card 2: Specific Assessment */}
                <div
                  onClick={() => {
                    setReferrerRewardMode('SPECIFIC_ASSESSMENT');
                    setSelectedReferrerPreset(null);
                    const first =
                      referrerSelectedAssessmentCode ||
                      availableAssessments[0]?.code ||
                      availableAssessments[0]?.id ||
                      '';
                    if (first) {
                      setReferrerSelectedAssessmentCode(first);
                      applySpecificAssessment(
                        first,
                        referrerAssignedAttempts,
                        referrerIncludeBonusRound,
                        referrerAssignedExpiryDays,
                        'referrer',
                      );
                    }
                  }}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    referrerRewardMode === 'SPECIFIC_ASSESSMENT'
                      ? 'border-purple-600 bg-purple-500/10 shadow-sm ring-2 ring-purple-500/20'
                      : 'border-border bg-card hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="referrerRewardStrategy"
                      checked={referrerRewardMode === 'SPECIFIC_ASSESSMENT'}
                      onChange={() => {}}
                      className="text-purple-600 focus:ring-purple-500 size-4"
                    />
                    <span className="font-bold text-foreground text-xs">🎯 Specific Assigned Assessment</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 pl-6">
                    Unlock a designated test blueprint specifically for the referrer candidate.
                  </p>
                </div>
              </div>

              {/* Referrer Option A: General Bonus Tests */}
              {referrerRewardMode === 'ROUNDS' && (
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <p className="text-[11px] text-muted-foreground font-semibold">
                    Referrer Reward Presets (Candidate who shares code):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {PRESET_REWARDS.map((p) => {
                      const isSelected = referrerRewardMode === 'ROUNDS' && selectedReferrerPreset === p.label;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => applyPreset(p, 'referrer')}
                          className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-purple-600 bg-purple-500/15 ring-2 ring-purple-500/30 text-purple-700 dark:text-purple-300 shadow-sm font-bold'
                              : 'border-border bg-card hover:border-purple-500 hover:bg-purple-500/5 text-foreground'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{p.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1">
                            {isSelected ? 'Selected for referrer' : 'Apply for referrer'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Referrer Option B: Specific Assigned Assessment */}
              {referrerRewardMode === 'SPECIFIC_ASSESSMENT' && (
                <div className="space-y-3 pt-2 border-t border-border/60">
                  <div>
                    <label className="font-bold text-foreground block mb-1">
                      Select Target Assessment Blueprint for Referrer *
                    </label>
                    <select
                      value={referrerSelectedAssessmentCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setReferrerSelectedAssessmentCode(code);
                        applySpecificAssessment(
                          code,
                          referrerAssignedAttempts,
                          referrerIncludeBonusRound,
                          referrerAssignedExpiryDays,
                          'referrer',
                        );
                      }}
                      className="w-full h-11 px-3 rounded-xl border-2 border-purple-500/50 bg-background font-bold text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                    >
                      <option value="">-- Choose an Assessment to Unlock for Referrer --</option>
                      {availableAssessments.map((a) => (
                        <option key={a.id} value={a.code || a.id}>
                          {a.name} ({a.code || a.id}) {a.durationMinutes ? `• ${a.durationMinutes}m` : ''} {a.role ? `[${a.role}]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-foreground block mb-1">Max Attempts Allowed</label>
                      <Input
                        type="number"
                        min="1"
                        value={referrerAssignedAttempts}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReferrerAssignedAttempts(val);
                          applySpecificAssessment(
                            referrerSelectedAssessmentCode,
                            val,
                            referrerIncludeBonusRound,
                            referrerAssignedExpiryDays,
                            'referrer',
                          );
                        }}
                        className="h-9 rounded-xl text-xs font-semibold"
                        placeholder="e.g. 1"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-foreground block mb-1">Validity (Days)</label>
                      <Input
                        type="number"
                        min="1"
                        value={referrerAssignedExpiryDays}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReferrerAssignedExpiryDays(val);
                          applySpecificAssessment(
                            referrerSelectedAssessmentCode,
                            referrerAssignedAttempts,
                            referrerIncludeBonusRound,
                            val,
                            'referrer',
                          );
                        }}
                        className="h-9 rounded-xl text-xs font-semibold"
                        placeholder="e.g. 30 (blank = never)"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-foreground font-semibold">
                    <input
                      type="checkbox"
                      checked={referrerIncludeBonusRound}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setReferrerIncludeBonusRound(val);
                        applySpecificAssessment(
                          referrerSelectedAssessmentCode,
                          referrerAssignedAttempts,
                          val,
                          referrerAssignedExpiryDays,
                          'referrer',
                        );
                      }}
                      className="rounded text-purple-600 focus:ring-purple-500 size-4"
                    />
                    <span>Also grant 1 assessment attempt quota to the referrer</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Schedule / Validity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-foreground block mb-1">Start Date (Optional)</label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="h-10 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-foreground block mb-1">End Date (Optional)</label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="h-10 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Advanced JSON toggle */}
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedJson(!showAdvancedJson)}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 h-8 px-2"
            >
              {showAdvancedJson ? '▼ Hide Advanced JSON Configs' : '▶ Show Advanced JSON Configs'}
            </Button>

            {showAdvancedJson && (
              <div className="space-y-3 mt-3 pt-3 border-t border-border">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">
                    Referee Reward JSON
                  </label>
                  <Textarea
                    value={refereeRewardJson}
                    onChange={(e) => setRefereeRewardJson(e.target.value)}
                    className="font-mono text-[11px] h-24 rounded-xl"
                  />
                </div>

                {type === 'CANDIDATE' && (
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">
                      Referrer Reward JSON
                    </label>
                    <Textarea
                      value={referrerRewardJson}
                      onChange={(e) => setReferrerRewardJson(e.target.value)}
                      className="font-mono text-[11px] h-24 rounded-xl"
                    />
                  </div>
                )}

                <div>
                  <label className="font-bold text-muted-foreground block mb-1">
                    Eligibility Config JSON
                  </label>
                  <Textarea
                    value={eligibilityJson}
                    onChange={(e) => setEligibilityJson(e.target.value)}
                    className="font-mono text-[11px] h-20 rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} className="h-9 px-4 rounded-xl text-xs font-bold">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
          >
            {saving ? 'Saving...' : existing ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Campaign Row Component
// ─────────────────────────────────────────────────────────────────────────────
interface CampaignRowProps {
  campaign: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

function CampaignRow({ campaign, onEdit, onDelete, onToggleStatus }: CampaignRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [codes, setCodes] = useState<any[]>(campaign.codes || []);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [newCodeCustom, setNewCodeCustom] = useState('');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const getShareableLink = (codeStr: string) => {
    const origin =
      typeof window !== 'undefined' && window.location.origin && window.location.origin.includes('skillitrix.com')
        ? window.location.origin
        : 'https://app.skillitrix.com';
    return `${origin}/signup?ref=${codeStr}`;
  };

  // Sync codes when campaign codes update
  useEffect(() => {
    if (campaign.codes) {
      setCodes(campaign.codes);
    }
  }, [campaign.codes]);

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const code = await referralsApi.adminGenerateCode(campaign.id, {
        code: newCodeCustom.trim() ? newCodeCustom.trim().toUpperCase() : undefined,
        maxUses: newCodeMaxUses ? Number(newCodeMaxUses) : undefined,
      });
      notifySuccess(`Generated code: ${code.code}`);
      setCodes((prev) => [code, ...prev]);
      setNewCodeCustom('');
      setNewCodeMaxUses('');
    } catch (err) {
      notifyApiError(err);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleDeactivateCode = async (codeId: string) => {
    try {
      await referralsApi.adminDeactivateCode(codeId);
      notifySuccess('Code deactivated');
      setCodes((prev) => prev.map((c) => (c.id === codeId ? { ...c, isActive: false } : c)));
    } catch (err) {
      notifyApiError(err);
    }
  };

  const copyCode = (codeStr: string) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedCode(codeStr);
    notifySuccess(`Copied code: ${codeStr}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyShareableLink = (codeStr: string) => {
    const link = getShareableLink(codeStr);
    navigator.clipboard.writeText(link);
    setCopiedLink(codeStr);
    notifySuccess(`Copied shareable link: ${link}`);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const rewardSummary = formatRewardSummary(campaign.refereeRewardConfig);
  const isActive = campaign.status === 'ACTIVE';
  const isPaused = campaign.status === 'PAUSED';

  return (
    <Card className="bg-card border border-border/80 shadow-sm rounded-2xl overflow-hidden hover:border-border transition-all">
      {/* Header Row */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-bold text-base text-foreground tracking-tight truncate">
              {campaign.name}
            </h3>

            {/* Type Badge */}
            <Badge
              variant="outline"
              className={
                campaign.type === 'COMPANY'
                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 font-bold text-[11px] px-2.5 py-0.5 rounded-full'
                  : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 font-bold text-[11px] px-2.5 py-0.5 rounded-full'
              }
            >
              {campaign.type === 'COMPANY' ? 'Company' : 'Candidate Peer'}
            </Badge>

            {/* Status Badge */}
            <Badge
              variant="outline"
              className={
                isActive
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1.5'
                  : isPaused
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 font-bold text-[11px] px-2.5 py-0.5 rounded-full'
                  : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20 font-bold text-[11px] px-2.5 py-0.5 rounded-full'
              }
            >
              {isActive && <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              {campaign.status}
            </Badge>
          </div>

          {campaign.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">{campaign.description}</p>
          )}

          {/* Metric Chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground pt-0.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60 font-semibold text-foreground text-[11px]">
              <Gift className="w-3 h-3 text-purple-500" />
              {rewardSummary}
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60 text-[11px]">
              <Code2 className="w-3 h-3 text-muted-foreground" />
              {codes.length} Code{codes.length !== 1 ? 's' : ''}
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60 text-[11px]">
              <Check className="w-3 h-3 text-muted-foreground" />
              {campaign.totalRedemptionCount} /{' '}
              {campaign.totalRedemptionLimit ? campaign.totalRedemptionLimit : '∞'} Redemptions
            </span>

            {campaign.endsAt && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60 text-[11px]">
                <Clock className="w-3 h-3 text-muted-foreground" />
                Ends {new Date(campaign.endsAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap md:flex-nowrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setExpanded(!expanded)}
            className="h-8 px-3 rounded-lg text-xs font-bold gap-1.5 border-border"
          >
            <Code2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Codes</span>
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px] ml-0.5 rounded-full">
              {codes.length}
            </Badge>
            {expanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onToggleStatus}
            className={
              isActive
                ? 'h-8 px-3 rounded-lg text-xs font-bold gap-1.5 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                : 'h-8 px-3 rounded-lg text-xs font-bold gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
            }
          >
            {isActive ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Activate
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="h-8 px-3 rounded-lg text-xs font-bold gap-1.5 border-border"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="h-8 px-2.5 rounded-lg text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            title="Delete Campaign"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Expanded Drawer: Codes Manager & Config Inspector */}
      {expanded && (
        <div className="border-t border-border bg-muted/10 p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Referral Codes Manager (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Referral Codes ({codes.length})
                </h4>
              </div>

              {/* Code Generation Form */}
              <div className="flex flex-col sm:flex-row items-center gap-2 p-3 rounded-xl bg-card border border-border/80">
                <Input
                  placeholder="Custom code (e.g. CAMPUS25) or leave blank"
                  value={newCodeCustom}
                  onChange={(e) => setNewCodeCustom(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  className="h-9 text-xs font-mono font-bold tracking-wider rounded-lg flex-1 uppercase"
                  maxLength={30}
                />
                <Input
                  type="number"
                  placeholder="Max uses (blank = ∞)"
                  value={newCodeMaxUses}
                  onChange={(e) => setNewCodeMaxUses(e.target.value)}
                  className="h-9 text-xs rounded-lg w-full sm:w-36"
                />
                <Button
                  size="sm"
                  onClick={handleGenerateCode}
                  disabled={generatingCode}
                  className="h-9 px-4 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg gap-1.5 shrink-0 w-full sm:w-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {generatingCode ? 'Creating...' : 'Create Code'}
                </Button>
              </div>

              {/* Codes Table / List */}
              {codes.length === 0 ? (
                <div className="p-6 text-center border border-dashed rounded-xl text-xs text-muted-foreground bg-card">
                  No codes generated yet. Click "Generate Code" to create one.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {codes.map((c: any) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between bg-card border border-border/80 rounded-xl px-3.5 py-2.5 shadow-sm text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <code className="font-mono text-xs font-bold tracking-widest text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                          {c.code}
                        </code>
                        <span className="text-muted-foreground text-[11px]">
                          Used: <b className="text-foreground">{c.usedCount}</b>
                          {c.maxUses ? ` / ${c.maxUses}` : ' / ∞'}
                        </span>
                        {!c.isActive && (
                          <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/20">
                            Deactivated
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyShareableLink(c.code)}
                          className="h-7 px-2.5 text-xs font-semibold rounded-md border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 gap-1"
                          title="Copy shareable campaign signup link"
                        >
                          {copiedLink === c.code ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 text-[10px]">Link Copied!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3 h-3" />
                              <span className="text-[10px]">Copy Link</span>
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyCode(c.code)}
                          className="h-7 px-2 text-xs font-semibold rounded-md border-border gap-1"
                          title="Copy referral code only"
                        >
                          {copiedCode === c.code ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 text-[10px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Code</span>
                            </>
                          )}
                        </Button>

                        {c.isActive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeactivateCode(c.id)}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive rounded-md"
                            title="Deactivate code"
                          >
                            Disable
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {codes.length > 0 && (
                <div className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/15 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Info className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    Shareable Link Format:
                  </span>
                  <code className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                    https://app.skillitrix.com/signup?ref=CODE
                  </code>
                </div>
              )}
            </div>

            {/* Right Column: Visual Reward Rules & JSON Config (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Configured Entitlement Rules
              </h4>

              <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3 text-xs">
                <div>
                  <span className="text-muted-foreground text-[11px] block">Candidate / Referee Reward:</span>
                  <p className="font-bold text-foreground text-sm mt-0.5">
                    {formatRewardSummary(campaign.refereeRewardConfig)}
                  </p>
                  <pre className="font-mono text-[10px] bg-muted/40 p-2 rounded-lg border border-border/60 text-muted-foreground mt-1 overflow-x-auto">
                    {prettyJson(campaign.refereeRewardConfig)}
                  </pre>
                </div>

                {campaign.type === 'CANDIDATE' && (
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Referrer Reward (Candidate A):</span>
                    <p className="font-bold text-foreground text-sm mt-0.5">
                      {formatRewardSummary(campaign.referrerRewardConfig)}
                    </p>
                    <pre className="font-mono text-[10px] bg-muted/40 p-2 rounded-lg border border-border/60 text-muted-foreground mt-1 overflow-x-auto">
                      {prettyJson(campaign.referrerRewardConfig)}
                    </pre>
                  </div>
                )}

                <div>
                  <span className="text-muted-foreground text-[11px] block">Eligibility & Fraud Rules:</span>
                  <pre className="font-mono text-[10px] bg-muted/40 p-2 rounded-lg border border-border/60 text-muted-foreground mt-1 overflow-x-auto">
                    {prettyJson(campaign.eligibilityConfig)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminReferralsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'COMPANY' | 'CANDIDATE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'EXPIRED'>('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [campaignsRes, statsRes] = await Promise.allSettled([
        referralsApi.adminGetCampaigns(),
        referralsApi.adminGetOverview(),
      ]);
      if (campaignsRes.status === 'fulfilled') {
        const val = campaignsRes.value as any;
        setCampaigns(val?.data ?? (Array.isArray(val) ? val : []));
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) return;
    try {
      await referralsApi.adminDeleteCampaign(id);
      notifySuccess('Campaign deleted successfully');
      load();
    } catch (err) {
      notifyApiError(err);
    }
  };

  const handleToggleStatus = async (campaign: any) => {
    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await referralsApi.adminUpdateCampaign(campaign.id, { status: newStatus });
      notifySuccess(`Campaign marked as ${newStatus}`);
      // Optimistic update
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaign.id ? { ...c, status: newStatus } : c)),
      );
    } catch (err) {
      notifyApiError(err);
    }
  };

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesDesc = c.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [campaigns, typeFilter, statusFilter, search]);

  const companyCount = campaigns.filter((c) => c.type === 'COMPANY').length;
  const candidateCount = campaigns.filter((c) => c.type === 'CANDIDATE').length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <AdminBillingHeader
        title="Referral Campaigns"
        description="Create and manage dynamic referral campaigns. Configure rewards, limits, and eligibility via JSON without code changes."
        actionButton={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading}
              className="h-10 px-4 rounded-xl text-xs font-bold gap-1.5 border-border"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditTarget(null);
                setShowCreate(true);
              }}
              className="h-10 px-4 rounded-xl text-xs font-bold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </Button>
          </div>
        }
      />

      {/* Overview Stats */}
      <OverviewStats stats={stats} loading={loading} />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/40 border border-border shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              typeFilter === 'ALL'
                ? 'bg-card text-foreground shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({campaigns.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('COMPANY')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              typeFilter === 'COMPANY'
                ? 'bg-card text-foreground shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Company ({companyCount})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('CANDIDATE')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              typeFilter === 'CANDIDATE'
                ? 'bg-card text-foreground shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Candidate Peer ({candidateCount})
          </button>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-10 px-3 rounded-xl border border-border bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 shrink-0"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {/* Campaigns List */}
      <div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm animate-pulse">
                <div className="h-6 bg-muted/60 rounded-lg w-1/3 mb-2" />
                <div className="h-4 bg-muted/40 rounded-lg w-1/2" />
              </Card>
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <Card className="bg-card border border-border/80 rounded-2xl shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Gift className="w-8 h-8" />
              </div>
              <div>
                <p className="text-foreground font-bold text-base">No referral campaigns found</p>
                <p className="text-muted-foreground text-xs mt-1 max-w-sm">
                  {search || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                    ? 'No campaigns match your current filters. Try resetting the filters.'
                    : 'Create your first campaign to start driving dynamic candidate referrals.'}
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditTarget(null);
                  setShowCreate(true);
                }}
                className="h-9 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredCampaigns.map((campaign: any) => (
              <CampaignRow
                key={campaign.id}
                campaign={campaign}
                onEdit={() => {
                  setEditTarget(campaign);
                  setShowCreate(true);
                }}
                onDelete={() => handleDelete(campaign.id)}
                onToggleStatus={() => handleToggleStatus(campaign)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      {showCreate && (
        <CampaignFormDialog
          open={showCreate}
          onClose={() => {
            setShowCreate(false);
            setEditTarget(null);
          }}
          onSave={() => {
            setShowCreate(false);
            setEditTarget(null);
            load();
          }}
          existing={editTarget}
        />
      )}
    </div>
  );
}
