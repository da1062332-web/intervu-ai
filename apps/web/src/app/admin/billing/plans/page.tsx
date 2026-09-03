'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Sliders,
  Check,
  Crown,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { billingApi } from '@/services/api/billing.api';
import { notifySuccess, notifyApiError } from '@/services/notifications/toast';
import { AdminBillingHeader } from '@/components/billing/admin-billing-header';
import type { PlanDto } from '@intervu-ai/contracts';

// PRESET SYSTEM LIMITATIONS CATALOG
const PRESET_LIMITATIONS = [
  {
    id: 'monthly_rounds_limit',
    key: 'monthly_rounds_limit',
    name: 'Monthly Practice Tests',
    type: 'NUMBER' as const,
    defaultValue: '3',
    presets: ['3', '5', '10', 'null'],
    presetLabels: ['3 Tests / Month', '5 Tests / Month', '10 Tests / Month', 'Unlimited Tests'],
    description: 'Maximum number of assessment rounds candidate can start per month',
  },
  {
    id: 'allowed_assessments',
    key: 'allowed_assessments',
    name: 'Specific Assigned Assessments',
    type: 'ARRAY' as const,
    defaultValue: 'all',
    presets: ['all'],
    presetLabels: ['All System Assessments'],
    description: 'Which specific tests and assessment blueprints the candidate is allowed to take',
  },
  {
    id: 'detailed_analytics',
    key: 'detailed_analytics',
    name: 'Detailed Results & Analysis',
    type: 'BOOLEAN' as const,
    defaultValue: 'true',
    presets: ['true', 'false'],
    presetLabels: ['Enabled (Full Insights & Breakdown)', 'Disabled (Basic Result Only)'],
    description: 'Access to deep skill radar, topic breakdown, and score progress charts',
  },
  {
    id: 'transcript_export',
    key: 'transcript_export',
    name: 'Generate & Download PDF Report',
    type: 'ARRAY' as const,
    defaultValue: 'markdown, pdf',
    presets: ['markdown, pdf', ''],
    presetLabels: ['Enabled (Generate & Download PDF)', 'Disabled'],
    description: 'Allow candidate to generate and download comprehensive PDF score report',
  },
  {
    id: 'history_limit',
    key: 'history_limit',
    name: 'Test Result History Retention',
    type: 'NUMBER' as const,
    defaultValue: '3',
    presets: ['3', '10', 'null'],
    presetLabels: ['Last 3 Results', 'Last 10 Results', 'Unlimited History'],
    description: 'Number of past completed test evaluations candidate can review',
  },
  {
    id: 'cohort_dashboard',
    key: 'cohort_dashboard',
    name: 'Cohort Performance Dashboard',
    type: 'BOOLEAN' as const,
    defaultValue: 'true',
    presets: ['true', 'false'],
    presetLabels: ['Enabled (Group Analytics)', 'Disabled'],
    description: 'Aggregated analytics and benchmarking across candidate cohort',
  },
  {
    id: 'support_tier',
    key: 'support_tier',
    name: 'Customer Support Level',
    type: 'STRING' as const,
    defaultValue: 'community',
    presets: ['community', 'email_1bd', 'named_contact'],
    presetLabels: ['Community Support', 'Email Support (1 Business Day)', 'Dedicated Account Contact'],
    description: 'Support response SLA and communication channel',
  },
];

const calculateAnchor = (priceMonthlyPaise: number) => {
  const inr = priceMonthlyPaise / 100;
  if (inr <= 0) return 0;
  if (inr < 50) return inr * 2;
  return Math.max(inr * 2, Math.round((inr * 2.08) / 100) * 100 - 1);
};

const calculateDiscount = (priceMonthlyPaise: number) => {
  const inr = priceMonthlyPaise / 100;
  const anchor = calculateAnchor(priceMonthlyPaise);
  if (anchor <= inr || inr <= 0) return 0;
  return Math.round(((anchor - inr) / anchor) * 100);
};

const formatLimitationValue = (valueJson: any) => {
  if (valueJson === null) return 'Unlimited';
  if (valueJson === true) return 'Enabled';
  if (valueJson === false) return 'Disabled';
  if (typeof valueJson === 'object' && valueJson !== null && !Array.isArray(valueJson)) {
    if (valueJson.assessments) {
      const list = Array.isArray(valueJson.assessments)
        ? valueJson.assessments.join(', ')
        : valueJson.assessments;
      const attemptsCount = valueJson.overallAttempts ?? valueJson.attemptsPerExam;
      const attempts = attemptsCount
        ? `${attemptsCount} attempt${attemptsCount > 1 ? 's' : ''} overall`
        : 'Unlimited attempts';
      return `${list} (${attempts})`;
    }
    return JSON.stringify(valueJson);
  }
  if (Array.isArray(valueJson)) {
    if (valueJson.length === 0) return 'Disabled';
    if (valueJson.some((v) => String(v).toLowerCase().includes('pdf'))) {
      return 'PDF Download Enabled';
    }
    return valueJson.join(', ');
  }
  return String(valueJson);
};

const getDisplayFeatureName = (feat: { featureKey: string; featureName: string; valueJson?: any }) => {
  if (
    feat.featureKey === 'allowed_assessments' &&
    typeof feat.valueJson === 'object' &&
    feat.valueJson !== null &&
    !Array.isArray(feat.valueJson)
  ) {
    const list = feat.valueJson.assessments;
    const attempts = feat.valueJson.overallAttempts ?? feat.valueJson.attemptsPerExam;
    const attemptsSuffix = attempts ? ` (${attempts} Attempt${attempts > 1 ? 's' : ''} Overall)` : ' (Unlimited Attempts)';
    if (Array.isArray(list)) {
      if (list.includes('all')) return `All System Assessments Access${attemptsSuffix}`;
      if (list.length === 0) return `No Assessments Assigned`;
      return `${list.length} Specific Assigned Assessment${list.length > 1 ? 's' : ''}${attemptsSuffix}`;
    }
  }
  return feat.featureName;
};

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [isPlansLoading, setIsPlansLoading] = useState(false);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanDto | null>(null);

  // New/Edit Plan Form State
  const [planForm, setPlanForm] = useState({
    slug: '',
    name: '',
    description: '',
    priceMonthlyInr: 0,
    originalPriceInr: '' as number | '',
    badge: '',
    isHighlighted: false,
    buttonText: 'Get Started',
    isActive: true,
  });

  // Add / Edit Feature Limitation Form State
  const [isAddFeatureOpen, setIsAddFeatureOpen] = useState(false);
  const [targetPlanId, setTargetPlanId] = useState<string | null>(null);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('monthly_rounds_limit');
  const [featureForm, setFeatureForm] = useState({
    featureKey: 'monthly_rounds_limit',
    featureName: 'Monthly Practice Tests',
    valueType: 'NUMBER' as 'NUMBER' | 'BOOLEAN' | 'ARRAY' | 'STRING',
    valueString: '3',
    description: 'Maximum number of assessment rounds candidate can start per month',
  });

  // Available Assessments State for assignment
  const [availableAssessments, setAvailableAssessments] = useState<any[]>([]);
  const [assessmentSearch, setAssessmentSearch] = useState('');
  const [attemptsPerExam, setAttemptsPerExam] = useState<number | null>(1);

  useEffect(() => {
    loadPlans();
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      const list = await billingApi.adminGetAvailableAssessments();
      setAvailableAssessments(list || []);
    } catch {
      // Fallback silently if offline
    }
  };

  const loadPlans = async () => {
    try {
      setIsPlansLoading(true);
      const data = await billingApi.adminGetAllPlans(true);
      setPlans(data);
    } catch (err) {
      notifyApiError(err, 'Failed to load plans');
    } finally {
      setIsPlansLoading(false);
    }
  };

  const updateLimitationTitleAndValue = (valStr: string, attempts: number | null) => {
    const attemptsSuffix =
      attempts === null
        ? ' (Unlimited Attempts)'
        : ` (${attempts} Attempt${attempts > 1 ? 's' : ''} Overall)`;

    let featureName = '';
    if (valStr === 'all') {
      featureName = `All System Assessments Access${attemptsSuffix}`;
    } else if (!valStr || valStr.trim() === '') {
      featureName = 'No Assessments Assigned';
    } else {
      const count = valStr.split(',').filter((s) => s.trim().length > 0).length;
      featureName = `${count} Specific Assigned Assessment${count > 1 ? 's' : ''}${attemptsSuffix}`;
    }

    setFeatureForm((prev) => ({
      ...prev,
      valueString: valStr,
      featureName,
    }));
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = PRESET_LIMITATIONS.find((p) => p.id === presetId);
    if (found) {
      setFeatureForm({
        featureKey: found.key,
        featureName: found.name,
        valueType: found.type,
        valueString: found.defaultValue,
        description: found.description,
      });
    }
  };

  const handleCreatePlan = async () => {
    try {
      if (!planForm.slug || !planForm.name) {
        notifyApiError('Plan slug and name are required');
        return;
      }
      await billingApi.adminCreatePlan({
        slug: planForm.slug.toLowerCase().trim(),
        name: planForm.name,
        description: planForm.description,
        priceMonthly: Number(planForm.priceMonthlyInr) * 100,
        originalPrice:
          planForm.originalPriceInr !== '' && Number(planForm.originalPriceInr) > 0
            ? Number(planForm.originalPriceInr) * 100
            : undefined,
        currency: 'INR',
        badge: planForm.badge || undefined,
        isHighlighted: planForm.isHighlighted,
        buttonText: planForm.buttonText,
        isActive: planForm.isActive,
        sortOrder: 0,
      });
      notifySuccess(`Plan '${planForm.name}' created successfully!`);
      setIsCreatePlanOpen(false);
      loadPlans();
    } catch (err) {
      notifyApiError(err, 'Failed to create plan');
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;
    try {
      await billingApi.adminUpdatePlan(selectedPlan.id, {
        name: planForm.name,
        description: planForm.description,
        priceMonthly: Number(planForm.priceMonthlyInr) * 100,
        originalPrice:
          planForm.originalPriceInr !== '' && Number(planForm.originalPriceInr) > 0
            ? Number(planForm.originalPriceInr) * 100
            : undefined,
        badge: planForm.badge || undefined,
        isHighlighted: planForm.isHighlighted,
        buttonText: planForm.buttonText,
        isActive: planForm.isActive,
      });
      notifySuccess(`Plan '${planForm.name}' updated successfully!`);
      setIsEditPlanOpen(false);
      loadPlans();
    } catch (err) {
      notifyApiError(err, 'Failed to update plan');
    }
  };

  const handleDeletePlan = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete/archive plan '${name}'?`)) return;
    try {
      await billingApi.adminDeletePlan(id);
      notifySuccess(`Plan '${name}' deleted successfully!`);
      loadPlans();
    } catch (err) {
      notifyApiError(err, 'Failed to delete plan');
    }
  };

  const handleOpenEditFeature = (planId: string, feat: any) => {
    setTargetPlanId(planId);
    setEditingFeatureId(feat.id || null);
    setSelectedPresetId(feat.featureKey);

    let valStr = '';
    let attempts: number | null = 1;

    if (feat.featureKey === 'allowed_assessments') {
      if (typeof feat.valueJson === 'object' && feat.valueJson !== null && !Array.isArray(feat.valueJson)) {
        attempts =
          feat.valueJson.overallAttempts !== undefined
            ? feat.valueJson.overallAttempts
            : feat.valueJson.attemptsPerExam !== undefined
            ? feat.valueJson.attemptsPerExam
            : 1;
        const tests = feat.valueJson.assessments;
        valStr = Array.isArray(tests) ? tests.join(', ') : String(tests || 'all');
      } else if (Array.isArray(feat.valueJson)) {
        attempts = null;
        valStr = feat.valueJson.join(', ');
      } else {
        attempts = null;
        valStr = String(feat.valueJson || 'all');
      }
    } else {
      valStr =
        feat.valueJson === null
          ? 'null'
          : typeof feat.valueJson === 'object'
          ? JSON.stringify(feat.valueJson)
          : String(feat.valueJson);
    }

    setAttemptsPerExam(attempts);
    setFeatureForm({
      featureKey: feat.featureKey,
      featureName: feat.featureName,
      valueType: feat.valueType,
      valueString: valStr,
      description: feat.description || '',
    });

    setIsAddFeatureOpen(true);
  };

  const handleSaveFeature = async () => {
    if (!targetPlanId || !featureForm.featureKey || !featureForm.featureName) {
      notifyApiError('Feature key and display name are required');
      return;
    }

    let parsedVal: any = featureForm.valueString;
    let finalFeatureName = featureForm.featureName;

    if (featureForm.featureKey === 'allowed_assessments') {
      const tests =
        featureForm.valueString === 'all'
          ? ['all']
          : featureForm.valueString.split(',').map((s) => s.trim()).filter(Boolean);
      
      const count = tests.length;
      const attemptsSuffix =
        attemptsPerExam === null
          ? ' (Unlimited Attempts)'
          : ` (${attemptsPerExam} Attempt${attemptsPerExam > 1 ? 's' : ''} Overall)`;

      if (tests.includes('all')) {
        finalFeatureName = `All System Assessments Access${attemptsSuffix}`;
      } else if (count === 0) {
        finalFeatureName = 'No Assessments Assigned';
      } else {
        finalFeatureName = `${count} Specific Assigned Assessment${count > 1 ? 's' : ''}${attemptsSuffix}`;
      }

      parsedVal = {
        assessments: tests,
        overallAttempts: attemptsPerExam,
        attemptsPerExam: attemptsPerExam,
      };
    } else if (featureForm.valueType === 'NUMBER') {
      parsedVal =
        featureForm.valueString === 'null' || featureForm.valueString === '' || featureForm.valueString === 'Unlimited'
          ? null
          : Number(featureForm.valueString);
    } else if (featureForm.valueType === 'BOOLEAN') {
      parsedVal = featureForm.valueString === 'true';
    } else if (featureForm.valueType === 'ARRAY') {
      parsedVal = featureForm.valueString.split(',').map((s) => s.trim()).filter(Boolean);
    }

    try {
      if (editingFeatureId) {
        await billingApi.adminUpdateFeature(targetPlanId, editingFeatureId, {
          featureName: finalFeatureName,
          valueType: featureForm.valueType,
          valueJson: parsedVal,
          description: featureForm.description,
          sortOrder: 0,
        });
        notifySuccess('Feature limitation updated successfully!');
      } else {
        await billingApi.adminAddFeature(targetPlanId, {
          featureKey: featureForm.featureKey,
          featureName: finalFeatureName,
          valueType: featureForm.valueType,
          valueJson: parsedVal,
          description: featureForm.description,
          sortOrder: 0,
        });
        notifySuccess('Feature limitation added successfully!');
      }
      setIsAddFeatureOpen(false);
      setEditingFeatureId(null);
      loadPlans();
    } catch (err) {
      notifyApiError(err, editingFeatureId ? 'Failed to update feature limitation' : 'Failed to add feature limitation');
    }
  };

  const handleDeleteFeature = async (planId: string, featureId: string, featureName: string) => {
    if (!confirm(`Delete limitation '${featureName}'?`)) return;
    try {
      await billingApi.adminDeleteFeature(planId, featureId);
      notifySuccess(`Limitation '${featureName}' deleted!`);
      loadPlans();
    } catch (err) {
      notifyApiError(err, 'Failed to delete limitation');
    }
  };

  const activePreset = PRESET_LIMITATIONS.find((p) => p.id === selectedPresetId);

  return (
    <div className='space-y-6 animate-fade-in-up'>
      <AdminBillingHeader
        title='Subscription Plans & Limitations'
        description='Configure dynamic subscription tiers, pricing, badges, and individual feature limitations.'
        actionButton={
          <Button
            onClick={() => {
              setPlanForm({
                slug: '',
                name: '',
                description: '',
                priceMonthlyInr: 0,
                originalPriceInr: '',
                badge: '',
                isHighlighted: false,
                buttonText: 'Get Started',
                isActive: true,
              });
              setIsCreatePlanOpen(true);
            }}
            className='h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200 text-xs sm:text-sm gap-2'
          >
            <Plus className='size-4' />
            Create New Plan
          </Button>
        }
      />

      {isPlansLoading ? (
        <div className='p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3'>
          <RefreshCw className='size-6 animate-spin text-indigo-600' />
          <span>Loading dynamic plans from database...</span>
        </div>
      ) : plans.length === 0 ? (
        <div className='p-12 text-center border border-dashed rounded-2xl'>
          <p className='text-sm text-muted-foreground'>No plans found in database.</p>
          <Button onClick={() => setIsCreatePlanOpen(true)} className='mt-4'>
            Create First Plan
          </Button>
        </div>
      ) : (
        /* Full-Width Plan Rows */
        <div className='space-y-5'>
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`rounded-2xl border transition-all ${
                plan.isHighlighted
                  ? 'border-2 border-indigo-600 shadow-md shadow-indigo-50 dark:shadow-none'
                  : 'border-border/80 bg-card'
              }`}
            >
              <CardContent className='p-6'>
                <div className='flex flex-col lg:flex-row items-start gap-6 lg:gap-8'>
                  {/* Left Column: Plan Summary & Actions */}
                  <div className='w-full lg:w-72 shrink-0 space-y-4 lg:border-r lg:border-border/60 lg:pr-6'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <h3 className='text-xl font-bold tracking-tight text-foreground'>{plan.name}</h3>
                        <Badge variant='outline' className='text-[10px] font-sans font-medium uppercase'>
                          {plan.slug}
                        </Badge>
                        {plan.badge && (
                          <Badge className='bg-indigo-600 text-white text-[10px] font-bold'>
                            {plan.badge}
                          </Badge>
                        )}
                      </div>
                      <p className='text-xs text-muted-foreground mt-1'>
                        {plan.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className='flex items-baseline gap-2 py-1 flex-wrap'>
                      {plan.priceMonthly > 0 && plan.originalPrice && plan.originalPrice > plan.priceMonthly && (
                        <>
                          <span className='text-emerald-600 dark:text-emerald-500 font-extrabold text-base tracking-tight flex items-center'>
                            ↓{Math.round(((plan.originalPrice - plan.priceMonthly) / plan.originalPrice) * 100)}%
                          </span>
                          <span className='line-through text-muted-foreground font-semibold text-base'>
                            ₹{(plan.originalPrice / 100).toLocaleString('en-IN')}
                          </span>
                        </>
                      )}
                      <span className='text-3xl font-extrabold text-foreground'>
                        {plan.priceMonthly === 0 ? 'Free' : `₹${(plan.priceMonthly / 100).toLocaleString('en-IN')}`}
                      </span>
                      {plan.priceMonthly > 0 && (
                        <span className='text-xs text-muted-foreground font-medium'>/ month</span>
                      )}
                    </div>

                    <div className='flex items-center gap-2 pt-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setSelectedPlan(plan);
                          setPlanForm({
                            slug: plan.slug,
                            name: plan.name,
                            description: plan.description || '',
                            priceMonthlyInr: plan.priceMonthly / 100,
                            originalPriceInr: plan.originalPrice ? plan.originalPrice / 100 : '',
                            badge: plan.badge || '',
                            isHighlighted: plan.isHighlighted,
                            buttonText: plan.buttonText,
                            isActive: plan.isActive,
                          });
                          setIsEditPlanOpen(true);
                        }}
                        className='flex-1 h-8 rounded-lg text-xs font-bold gap-1.5'
                      >
                        <Edit2 className='size-3.5' />
                        Edit Plan
                      </Button>

                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleDeletePlan(plan.id, plan.name)}
                        className='h-8 px-3 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200'
                        title='Delete Plan'
                      >
                        <Trash2 className='size-3.5' />
                      </Button>
                    </div>
                  </div>

                  {/* Right Column: Configured Limitations in a Spacious Responsive Grid */}
                  <div className='flex-1 w-full space-y-3'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                          Configured Limitations ({plan.features.length})
                        </span>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setTargetPlanId(plan.id);
                          setEditingFeatureId(null);
                          handleSelectPreset('monthly_rounds_limit');
                          setIsAddFeatureOpen(true);
                        }}
                        className='h-7 px-2.5 text-indigo-600 border-indigo-200 hover:text-indigo-700 hover:bg-indigo-50 text-xs font-bold gap-1'
                      >
                        <Plus className='size-3' />
                        Choose Limit
                      </Button>
                    </div>

                    {plan.features.length === 0 ? (
                      <div className='p-6 text-center border border-dashed rounded-xl text-xs text-muted-foreground'>
                        No limitations configured yet. Click "+ Choose Limit" to add features to this tier.
                      </div>
                    ) : (
                      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5'>
                        {plan.features.map((feat) => (
                          <div
                            key={feat.id}
                            className='flex items-start justify-between gap-2 p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-xs'
                          >
                            <div className='space-y-1 min-w-0 flex-1'>
                              <div className='font-semibold text-foreground truncate'>
                                {getDisplayFeatureName(feat)}
                              </div>
                              <div className='text-xs text-muted-foreground font-sans truncate'>
                                <span>{feat.featureKey}: </span>
                                <span className='text-indigo-600 dark:text-indigo-400 font-semibold'>
                                  {formatLimitationValue(feat.valueJson)}
                                </span>
                              </div>
                            </div>

                            <div className='flex items-center gap-1 shrink-0 mt-0.5'>
                              <button
                                onClick={() => handleOpenEditFeature(plan.id, feat)}
                                className='p-1 text-muted-foreground hover:text-indigo-600 transition-colors'
                                title='Edit Limitation'
                              >
                                <Edit2 className='size-3.5' />
                              </button>
                              <button
                                onClick={() => handleDeleteFeature(plan.id, feat.id!, feat.featureName)}
                                className='p-1 text-muted-foreground hover:text-rose-600 transition-colors'
                                title='Delete Limitation'
                              >
                                <Trash2 className='size-3.5' />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE / EDIT PLAN MODAL */}
      {(isCreatePlanOpen || isEditPlanOpen) && (
        <div className='fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex min-h-screen items-center justify-center p-4 sm:p-6'>
          <div className='relative w-full max-w-lg rounded-2xl bg-white dark:bg-card border border-border p-6 shadow-2xl space-y-4 my-auto max-h-[88vh] overflow-y-auto'>
            <h3 className='text-lg font-bold text-foreground'>
              {isCreatePlanOpen ? 'Create New Subscription Plan' : `Edit Plan: ${selectedPlan?.name}`}
            </h3>

            <div className='space-y-3 text-xs'>
              {isCreatePlanOpen && (
                <div>
                  <label className='block font-bold text-muted-foreground mb-1'>Plan Slug (e.g. starter)</label>
                  <Input
                    value={planForm.slug}
                    onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })}
                    placeholder='e.g. starter, student, enterprise'
                  />
                </div>
              )}

              <div>
                <label className='block font-bold text-muted-foreground mb-1'>Display Name</label>
                <Input
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder='e.g. Pro Plan, Student Special'
                />
              </div>

              <div>
                <label className='block font-bold text-muted-foreground mb-1'>Description</label>
                <Input
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder='Short plan summary...'
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block font-bold text-muted-foreground mb-1'>Monthly Price (₹)</label>
                  <Input
                    type='number'
                    value={planForm.priceMonthlyInr}
                    onChange={(e) => setPlanForm({ ...planForm, priceMonthlyInr: Number(e.target.value) })}
                    placeholder='e.g. 2400'
                  />
                </div>
                <div>
                  <label className='block font-bold text-muted-foreground mb-1'>Original / Slash Price (₹)</label>
                  <Input
                    type='number'
                    value={planForm.originalPriceInr}
                    onChange={(e) =>
                      setPlanForm({
                        ...planForm,
                        originalPriceInr: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    placeholder='e.g. 4999 (for ↓52% off)'
                  />
                </div>
              </div>

              {Number(planForm.originalPriceInr) > Number(planForm.priceMonthlyInr) &&
                Number(planForm.originalPriceInr) > 0 && (
                  <div className='p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs'>
                    <span className='font-bold text-emerald-700 dark:text-emerald-400'>
                      Preview Dynamic Discount:
                    </span>
                    <div className='flex items-baseline gap-1.5 font-bold'>
                      <span className='text-emerald-600 dark:text-emerald-400 font-extrabold'>
                        ↓
                        {Math.round(
                          ((Number(planForm.originalPriceInr) - Number(planForm.priceMonthlyInr)) /
                            Number(planForm.originalPriceInr)) *
                            100,
                        )}
                        %
                      </span>
                      <span className='line-through text-muted-foreground'>
                        ₹{Number(planForm.originalPriceInr).toLocaleString('en-IN')}
                      </span>
                      <span className='text-foreground font-black'>
                        ₹{Number(planForm.priceMonthlyInr).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block font-bold text-muted-foreground mb-1'>Badge (Optional)</label>
                  <Input
                    value={planForm.badge}
                    onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                    placeholder='e.g. POPULAR, BEST VALUE'
                  />
                </div>
                <div>
                  <label className='block font-bold text-muted-foreground mb-1'>CTA Button Text</label>
                  <Input
                    value={planForm.buttonText}
                    onChange={(e) => setPlanForm({ ...planForm, buttonText: e.target.value })}
                    placeholder='e.g. Upgrade to Pro'
                  />
                </div>
              </div>

              <div className='flex items-center gap-4 pt-2'>
                <label className='flex items-center gap-2 cursor-pointer font-medium'>
                  <input
                    type='checkbox'
                    checked={planForm.isHighlighted}
                    onChange={(e) => setPlanForm({ ...planForm, isHighlighted: e.target.checked })}
                    className='rounded border-border'
                  />
                  Highlight as Recommended Card
                </label>
              </div>
            </div>

            <div className='flex items-center justify-end gap-2 pt-4 border-t border-border/60'>
              <Button
                variant='outline'
                onClick={() => {
                  setIsCreatePlanOpen(false);
                  setIsEditPlanOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={isCreatePlanOpen ? handleCreatePlan : handleUpdatePlan}
                className='bg-indigo-600 hover:bg-indigo-700 text-white font-bold'
              >
                {isCreatePlanOpen ? 'Create Plan' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CHOOSE / ADD FEATURE LIMITATION MODAL */}
      {isAddFeatureOpen && (
        <div className='fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex min-h-screen items-center justify-center p-4 sm:p-6'>
          <div className='relative w-full max-w-lg rounded-2xl bg-white dark:bg-card border border-border p-6 shadow-2xl space-y-4 my-auto max-h-[88vh] overflow-y-auto'>
            <div className='flex items-center justify-between border-b border-border/60 pb-3'>
              <div className='flex items-center gap-2'>
                <Sliders className='size-5 text-indigo-600' />
                <h3 className='text-lg font-bold text-foreground'>
                  {editingFeatureId ? 'Edit Feature Limitation' : 'Configure Feature Limitation'}
                </h3>
              </div>
            </div>

            <div className='space-y-4 text-xs'>
              {/* Feature Preset Selector */}
              <div>
                <label className='block font-bold text-muted-foreground mb-1.5'>
                  Choose System Limitation:
                </label>
                <select
                  value={selectedPresetId}
                  disabled={!!editingFeatureId}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className='w-full h-11 px-3 rounded-xl border-2 border-indigo-600/30 bg-background font-semibold text-sm focus:border-indigo-600 outline-none disabled:opacity-60 disabled:bg-muted/40'
                >
                  <optgroup label='System Limitations & Entitlements'>
                    <option value='monthly_rounds_limit'>Monthly Practice Tests Quota</option>
                    <option value='allowed_assessments'>Specific Assigned Assessments</option>
                    <option value='detailed_analytics'>Detailed Results & Performance Analysis</option>
                    <option value='transcript_export'>Generate & Download PDF Report</option>
                    <option value='history_limit'>Test Result History Retention</option>
                    <option value='cohort_dashboard'>Cohort Performance Dashboard</option>
                    <option value='support_tier'>Customer Support Level</option>
                  </optgroup>
                </select>
              </div>

              {/* Quick Value Presets */}
              {activePreset && activePreset.presets.length > 0 && (
                <div className='p-3 bg-muted/40 rounded-xl border border-border/60 space-y-2'>
                  <label className='block font-bold text-muted-foreground text-[11px] uppercase tracking-wider'>
                    Quick Value Presets:
                  </label>
                  <div className='flex flex-wrap gap-2'>
                    {activePreset.presets.map((val, idx) => {
                      const label = activePreset.presetLabels[idx] || val;
                      const isSelected = featureForm.valueString === val;
                      return (
                        <button
                          key={idx}
                          type='button'
                          onClick={() => setFeatureForm({ ...featureForm, valueString: val })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30'
                              : 'bg-background hover:bg-muted border border-border text-foreground'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Assessment Checklist for allowed_assessments */}
              {selectedPresetId === 'allowed_assessments' && (
                <div className='p-3.5 bg-muted/30 rounded-xl border border-border/60 space-y-2.5'>
                  <div className='flex items-center justify-between'>
                    <label className='font-bold text-muted-foreground text-[11px] uppercase tracking-wider'>
                      System Assessment Catalog ({availableAssessments.length} available):
                    </label>
                    <div className='flex items-center gap-1.5 text-[11px]'>
                      <button
                        type='button'
                        onClick={() => {
                          updateLimitationTitleAndValue('all', attemptsPerExam);
                        }}
                        className='text-indigo-600 hover:underline font-semibold'
                      >
                        Select All
                      </button>
                      <span className='text-muted-foreground'>•</span>
                      <button
                        type='button'
                        onClick={() => {
                          updateLimitationTitleAndValue('', attemptsPerExam);
                        }}
                        className='text-rose-600 hover:underline font-semibold'
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <Input
                    placeholder='Filter assessments by name or role...'
                    value={assessmentSearch}
                    onChange={(e) => setAssessmentSearch(e.target.value)}
                    className='h-8 text-xs font-sans'
                  />

                  <div className='max-h-52 overflow-y-auto space-y-1.5 pr-1'>
                    {availableAssessments.length === 0 ? (
                      <div className='p-4 text-center text-xs text-muted-foreground'>
                        Loading assessments...
                      </div>
                    ) : (
                      availableAssessments
                        .filter((a) =>
                          assessmentSearch
                            ? a.name?.toLowerCase().includes(assessmentSearch.toLowerCase()) ||
                              (a.role && a.role.toLowerCase().includes(assessmentSearch.toLowerCase()))
                            : true,
                        )
                        .map((test) => {
                          const currentValues = featureForm.valueString.split(',').map((s) => s.trim());
                          const isAll = featureForm.valueString === 'all';
                          const testIdentifier = test.code || test.id;
                          const isChecked = isAll || currentValues.includes(testIdentifier);

                          const handleToggle = () => {
                            let nextValues: string[];
                            if (isAll) {
                              nextValues = availableAssessments
                                .map((a) => a.code || a.id)
                                .filter((id) => id !== testIdentifier);
                            } else if (isChecked) {
                              nextValues = currentValues.filter((v) => v !== testIdentifier && v !== 'all');
                            } else {
                              nextValues = [...currentValues.filter((v) => v && v !== 'all'), testIdentifier];
                            }

                            const nextStr =
                              nextValues.length === availableAssessments.length ? 'all' : nextValues.join(', ');
                            updateLimitationTitleAndValue(nextStr, attemptsPerExam);
                          };

                          return (
                            <label
                              key={test.id}
                              className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800'
                                  : 'bg-background hover:bg-muted/40 border-border/60'
                              }`}
                            >
                              <input
                                type='checkbox'
                                checked={isChecked}
                                onChange={handleToggle}
                                className='mt-0.5 rounded border-border text-indigo-600 focus:ring-indigo-500'
                              />
                              <div className='flex-1 min-w-0'>
                                <div className='font-semibold text-foreground truncate'>{test.name}</div>
                                <div className='text-[10px] text-muted-foreground flex items-center gap-2'>
                                  {test.role && <span>Role: {test.role}</span>}
                                  {test.durationMinutes && <span>• {test.durationMinutes} mins</span>}
                                </div>
                              </div>
                            </label>
                          );
                        })
                    )}
                  </div>

                  {/* Allowed Attempts Configuration for allowed_assessments */}
                  <div className='p-3 bg-muted/40 rounded-xl border border-border/60 space-y-2.5 mt-2'>
                    <div className='flex items-center justify-between'>
                      <label className='font-bold text-muted-foreground text-[11px] uppercase tracking-wider'>
                        Allowed Attempts per Candidate Overall (Across Plan):
                      </label>
                      <span className='text-[11px] font-bold text-indigo-600 dark:text-indigo-400'>
                        {attemptsPerExam === null ? 'Unlimited Attempts' : `${attemptsPerExam} Attempt${attemptsPerExam > 1 ? 's' : ''} Overall`}
                      </span>
                    </div>

                    <div className='flex flex-wrap items-center gap-1.5'>
                      {[1, 2, 3, 5, null].map((attempts, idx) => {
                        const label = attempts === null ? 'Unlimited' : `${attempts} ${attempts === 1 ? 'Attempt' : 'Attempts'}`;
                        const isSelected = attemptsPerExam === attempts;
                        return (
                          <button
                            key={idx}
                            type='button'
                            onClick={() => {
                              setAttemptsPerExam(attempts);
                              updateLimitationTitleAndValue(featureForm.valueString, attempts);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30'
                                : 'bg-background hover:bg-muted border border-border text-foreground'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Specific / Custom Number Input */}
                    <div className='flex items-center gap-2 pt-1 border-t border-border/40'>
                      <span className='text-xs text-muted-foreground font-medium'>Or enter specific number of attempts:</span>
                      <div className='flex items-center gap-1.5'>
                        <input
                          type='number'
                          min={1}
                          max={999}
                          placeholder='e.g. 4, 10'
                          value={attemptsPerExam === null ? '' : attemptsPerExam}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            if (val === '') {
                              setAttemptsPerExam(null);
                              updateLimitationTitleAndValue(featureForm.valueString, null);
                            } else {
                              const num = Math.max(1, parseInt(val, 10) || 1);
                              setAttemptsPerExam(num);
                              updateLimitationTitleAndValue(featureForm.valueString, num);
                            }
                          }}
                          className='w-24 h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-bold text-foreground focus:border-indigo-600 outline-none'
                        />
                        <span className='text-xs text-muted-foreground font-semibold'>Attempts</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className='space-y-3 pt-1'>
                <div>
                  <label className='block font-bold text-muted-foreground mb-1'>Display Name on Plan Card</label>
                  <Input
                    value={featureForm.featureName}
                    onChange={(e) => setFeatureForm({ ...featureForm, featureName: e.target.value })}
                    placeholder='e.g. 5 Practice Tests / Month, Full Skill Mastery'
                  />
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block font-bold text-muted-foreground mb-1'>Feature Key (System Code)</label>
                    <Input
                      value={featureForm.featureKey}
                      disabled
                      placeholder='e.g. monthly_rounds_limit'
                      className='bg-muted/50 font-sans text-xs'
                    />
                  </div>

                  <div>
                    <label className='block font-bold text-muted-foreground mb-1'>Configured Value</label>
                    <Input
                      value={featureForm.valueString}
                      onChange={(e) => setFeatureForm({ ...featureForm, valueString: e.target.value })}
                      placeholder='e.g. 3, null, true'
                      className='font-bold'
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className='flex items-center justify-end gap-2 pt-4 border-t border-border/60'>
              <Button
                variant='outline'
                onClick={() => {
                  setIsAddFeatureOpen(false);
                  setEditingFeatureId(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveFeature} className='bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5'>
                <Check className='size-4' />
                {editingFeatureId ? 'Save Changes' : 'Save Limitation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
