'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Play,
  Save,
  Sparkles,
  AlertTriangle,
  Info,
  Check,
  Loader2,
  RefreshCw,
  Code2,
  FileText,
  Terminal,
  ShieldCheck,
  Cpu,
  Sliders,
  Layers,
} from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import {
  useCodingPattern,
  useCreateCodingPattern,
  useUpdateCodingPattern,
  usePreviewCodingPattern,
} from '@/services/coding-patterns/hooks';
import { PatternPreviewResponse } from '@/services/coding-patterns/api';
import { getCodingOracles, CodingOracleItem } from '@/services/coding-oracles/api';
import { useTopics } from '@/services/topics';
import { useConcepts } from '@/services/concept-mapping';

const STEPS = [
  { id: 1, name: 'Basic Information' },
  { id: 2, name: 'Problem Configuration' },
  { id: 3, name: 'Reference Solution' },
  { id: 4, name: 'Preview & Validation' },
  { id: 5, name: 'Publish' },
];

export default function CodingPatternBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryTopicId = searchParams?.get('topicId') || '';
  const queryConceptKey = searchParams?.get('conceptKey') || '';

  const patternId = (params?.id as string) || 'new';
  const isNew = patternId === 'new';

  const { data: existingPattern, isLoading } = useCodingPattern(patternId);
  const createMutation = useCreateCodingPattern();
  const updateMutation = useUpdateCodingPattern();
  const previewMutation = usePreviewCodingPattern();

  const [currentStep, setCurrentStep] = useState(1);
  const [oracles, setOracles] = useState<CodingOracleItem[]>([]);
  const [loadingOracles, setLoadingOracles] = useState<boolean>(true);
  const [oracleError, setOracleError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    difficulty: 'MEDIUM',
    status: 'DRAFT',
    version: 1,
    oracleKey: '',
    topicId: queryTopicId,
    conceptKey: queryConceptKey,
    statementSpecification: JSON.stringify({ problemType: 'ARRAY', returnType: 'ARRAY' }, null, 2),
    parameterSchema: JSON.stringify(
      { arraySize: { type: 'integer', min: 5, max: 15 }, k: { type: 'integer', min: 1, max: 10 } },
      null,
      2,
    ),
    constraintSchema: JSON.stringify({ arr: { minSize: 1, maxSize: 100 } }, null, 2),
    starterCode: JSON.stringify(
      {
        python: 'def rotate(arr, k):\n    pass\n',
        java: 'class Solution {\n    public int[] rotate(int[] arr, int k) {\n        return new int[0];\n    }\n}\n',
        cpp: '#include <vector>\nusing namespace std;\n\nvector<int> rotate(vector<int>& arr, int k) {\n    return {};\n}\n',
      },
      null,
      2,
    ),
  });

  const { data: topicsData } = useTopics();
  const topicsList = Array.isArray(topicsData) ? topicsData : (topicsData as any)?.items || [];

  const { data: conceptsData } = useConcepts(
    formData.topicId && formData.topicId !== 'none' ? formData.topicId : '',
  );
  const conceptsList = Array.isArray(conceptsData)
    ? conceptsData
    : (conceptsData as any)?.items || [];

  const [previewResult, setPreviewResult] = useState<PatternPreviewResponse | null>(null);
  const [generateStatement, setGenerateStatement] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLanguageTab, setSelectedLanguageTab] = useState<
    'python' | 'java' | 'cpp'
  >('python');
  const [starterCodeMode, setStarterCodeMode] = useState<'visual' | 'json'>('visual');

  const updateStarterCodeForLang = (lang: string, code: string) => {
    try {
      const currentObj = JSON.parse(formData.starterCode || '{}');
      const updated = { ...currentObj, [lang]: code };
      handleChange('starterCode', JSON.stringify(updated, null, 2));
    } catch {
      const updated = { [lang]: code };
      handleChange('starterCode', JSON.stringify(updated, null, 2));
    }
  };

  const getStarterCodeForLang = (lang: string): string => {
    try {
      const currentObj = JSON.parse(formData.starterCode || '{}');
      return currentObj[lang] || '';
    } catch {
      return '';
    }
  };

  const autoGenerateStarterCode = () => {
    let args = 'inputData';
    let javaArgs = 'Object inputData';
    let cppArgs = 'auto inputData';

    try {
      const parsedSchema = JSON.parse(formData.parameterSchema || '{}');
      const keys = Object.keys(parsedSchema);
      if (keys.length > 0) {
        args = keys.join(', ');
        javaArgs = keys.map((k) => `Object ${k}`).join(', ');
        cppArgs = keys.map((k) => `auto ${k}`).join(', ');
      }
    } catch {}

    const defaultCode = {
      python: `def solve(${args}):\n    pass\n`,
      java: `class Solution {\n    public Object solve(${javaArgs}) {\n        return null;\n    }\n}\n`,
      cpp: `auto solve(${cppArgs}) {\n    return 0;\n}\n`,
    };

    handleChange('starterCode', JSON.stringify(defaultCode, null, 2));
  };

  const loadOracles = async () => {
    try {
      setLoadingOracles(true);
      setOracleError(null);
      const data = await getCodingOracles(undefined, true);
      const items = data?.items || [];
      setOracles(items);
      if (items.length > 0) {
        setFormData((prev) => ({
          ...prev,
          oracleKey: prev.oracleKey || items[0].key,
        }));
      }
    } catch (err: any) {
      setOracleError(err?.message || 'Failed to load dynamic Oracles from server');
    } finally {
      setLoadingOracles(false);
    }
  };

  useEffect(() => {
    loadOracles();
  }, []);

  useEffect(() => {
    if (existingPattern && !isNew) {
      const meta = (existingPattern.metadata as any) || {};
      const spec = (existingPattern.statementSpecification as any) || {};
      const savedNarrative = spec.narrative || spec.problemStatement || meta.narrative;

      setFormData((prev) => ({
        ...prev,
        title: existingPattern.title || '',
        slug: existingPattern.slug || '',
        description: existingPattern.description || '',
        difficulty: existingPattern.difficulty || 'MEDIUM',
        status: existingPattern.status || 'DRAFT',
        version: existingPattern.version || 1,
        oracleKey: existingPattern.oracleKey || '',
        topicId: meta.topicId || queryTopicId || '',
        conceptKey: meta.conceptKey || queryConceptKey || '',
        statementSpecification: JSON.stringify(
          existingPattern.statementSpecification || {},
          null,
          2,
        ),
        parameterSchema: JSON.stringify(existingPattern.parameterSchema || {}, null, 2),
        constraintSchema: JSON.stringify(existingPattern.constraintSchema || {}, null, 2),
        starterCode: JSON.stringify(existingPattern.starterCode || {}, null, 2),
      }));

      // If pattern already has a saved narrative, preload it into previewResult
      if (savedNarrative) {
        const testCases = existingPattern.testCases || [];
        const publicTests = testCases.filter((t: any) => t.isPublic);
        const hiddenTests = testCases.filter(
          (t: any) => !t.isPublic && !t.isStress && !t.isBoundary,
        );
        const stressTests = testCases.filter((t: any) => t.isStress);
        const boundaryTests = testCases.filter((t: any) => t.isBoundary);

        setPreviewResult({
          parameters: {},
          generatedInput: publicTests[0]?.input || {},
          expectedOutput: publicTests[0]?.expectedOutput || {},
          publicTests,
          hiddenTests,
          stressTests,
          boundaryTests,
          validation: { valid: true, errors: [], warnings: [] },
          aiPreview: {
            narrative: savedNarrative,
            codeSkeletons: (existingPattern.starterCode as any) || {},
          },
        });
      }
    }
  }, [existingPattern, isNew, queryTopicId, queryConceptKey]);

  // Auto-sync parameterSchema and difficulty with selected Oracle
  useEffect(() => {
    const selectedOracle = oracles.find((o) => o.key === formData.oracleKey);
    if (selectedOracle) {
      if (
        selectedOracle.parameterSchema &&
        Object.keys(selectedOracle.parameterSchema).length > 0
      ) {
        try {
          const currentParsed = JSON.parse(formData.parameterSchema || '{}');
          if (
            !currentParsed ||
            Object.keys(currentParsed).length === 0 ||
            (currentParsed.arraySize && selectedOracle.key !== 'ARRAY_ROTATION_ORACLE')
          ) {
            setFormData((prev) => ({
              ...prev,
              parameterSchema: JSON.stringify(selectedOracle.parameterSchema, null, 2),
            }));
          }
        } catch {
          setFormData((prev) => ({
            ...prev,
            parameterSchema: JSON.stringify(selectedOracle.parameterSchema, null, 2),
          }));
        }
      }

      // Auto-set difficulty to supported difficulty if current selection is invalid
      const supported = (selectedOracle.supportedDifficulties || []).map((d) => String(d).toUpperCase());
      if (supported.length > 0 && !supported.includes(formData.difficulty.toUpperCase())) {
        setFormData((prev) => ({
          ...prev,
          difficulty: supported[0],
        }));
      }
    }
  }, [oracles, formData.oracleKey]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectedOracle = oracles.find((o) => o.key === formData.oracleKey);
  const isOracleInactive = selectedOracle && selectedOracle.isActive === false;
  const isOracleProviderMissing = selectedOracle && selectedOracle.isProviderAvailable === false;
  const isOracleUnavailable = Boolean(isOracleInactive || isOracleProviderMissing);

  const handleRunPreview = async (forceRegenerate: boolean = false) => {
    try {
      const payload = {
        patternId: isNew ? undefined : patternId,
        oracleKey: formData.oracleKey,
        parameterSchema: JSON.parse(formData.parameterSchema || '{}'),
        constraintSchema: JSON.parse(formData.constraintSchema || '{}'),
        difficulty: formData.difficulty,
        seed: (() => {
          const str = formData.oracleKey || '';
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
          }
          return Math.abs(hash % 90000) + 10000;
        })(),
        generateStatement,
        forceRegenerate,
      };
      const res = await previewMutation.mutateAsync(payload);
      setPreviewResult(res);
    } catch (err: any) {
      alert(`Preview generation failed: ${err.message}`);
    }
  };

  // Auto-run preview on entering Step 4 if not already loaded
  useEffect(() => {
    if (
      currentStep === 4 &&
      !previewResult &&
      formData.oracleKey &&
      !isOracleUnavailable &&
      !previewMutation.isPending
    ) {
      handleRunPreview(false);
    }
  }, [currentStep, formData.oracleKey, previewResult, isOracleUnavailable]);

  const validateStep1 = (): boolean => {
    if (!formData.title.trim()) {
      alert('Pattern Title is required.');
      return false;
    }
    if (!formData.slug.trim()) {
      alert('URL Slug is required.');
      return false;
    }
    if (!formData.topicId || formData.topicId === 'none') {
      alert('Topic is required. Please select a Topic.');
      return false;
    }
    if (!formData.conceptKey || formData.conceptKey === 'none') {
      alert('Concept is required. Please select a Concept.');
      return false;
    }
    if (!formData.oracleKey) {
      alert('Oracle Engine Key is required. Please select an Oracle Engine.');
      return false;
    }
    if (!formData.difficulty) {
      alert('Target Difficulty is required. Please select a difficulty.');
      return false;
    }
    return true;
  };

  const handleSave = async (publish: boolean = false) => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    setIsSaving(true);
    try {
      const statementSpec = JSON.parse(formData.statementSpecification || '{}');
      if (previewResult?.aiPreview?.narrative) {
        statementSpec.narrative = previewResult.aiPreview.narrative;
        if (previewResult.aiPreview.codeSkeletons) {
          statementSpec.codeSkeletons = previewResult.aiPreview.codeSkeletons;
        }
      }

      const payload = {
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: formData.description,
        difficulty: formData.difficulty as any,
        status: (publish ? 'PUBLISHED' : formData.status) as any,
        version: Number(formData.version),
        oracleKey: formData.oracleKey,
        statementSpecification: statementSpec,
        parameterSchema: JSON.parse(formData.parameterSchema || '{}'),
        constraintSchema: JSON.parse(formData.constraintSchema || '{}'),
        starterCode: JSON.parse(formData.starterCode || '{}'),
        metadata: {
          ...((existingPattern?.metadata as any) || {}),
          topicId: formData.topicId && formData.topicId !== 'none' ? formData.topicId : undefined,
          conceptKey:
            formData.conceptKey && formData.conceptKey !== 'none' ? formData.conceptKey : undefined,
        },
      };

      if (isNew) {
        await createMutation.mutateAsync(payload);
      } else {
        await updateMutation.mutateAsync({ id: patternId, payload });
      }

      router.push('/admin/coding-patterns');
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !isNew) {
    return (
      <div className='p-8 flex items-center justify-center min-h-[400px]'>
        <div className='flex items-center gap-2 text-muted-foreground'>
          <Loader2 className='w-5 h-5 animate-spin' /> Loading Coding Pattern...
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-6 max-w-6xl mx-auto pb-24'>
      {/* Oracle Warning Banner */}
      {isOracleUnavailable && (
        <div className='p-4 border border-red-300 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 text-xs flex items-center justify-between shadow-sm'>
          <div className='flex items-center gap-3'>
            <AlertTriangle className='w-5 h-5 text-red-600 shrink-0' />
            <div>
              <span className='font-semibold text-sm block'>Referenced Oracle is Unavailable</span>
              <p className='text-xs text-red-700 dark:text-red-300'>
                {isOracleInactive &&
                  `Oracle "${selectedOracle?.name}" (${selectedOracle?.key}) is set to INACTIVE by admin.`}
                {isOracleProviderMissing &&
                  `Oracle "${selectedOracle?.name}" (${selectedOracle?.key}) has no registered executable backend provider.`}{' '}
                Draft saving is permitted, but Pattern Preview and Publishing are strictly disabled
                until the Oracle is active and registered.
              </p>
            </div>
          </div>
          <Button
            size='sm'
            variant='outline'
            onClick={() => router.push('/admin/coding-oracles')}
            className='text-xs shrink-0 border-red-300 hover:bg-red-100'
          >
            Manage Oracles
          </Button>
        </div>
      )}

      {/* Top Navigation */}
      <div className='flex items-center justify-between border-b pb-4'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='sm' onClick={() => router.push('/admin/coding-patterns')}>
            <ArrowLeft className='w-4 h-4 mr-1' /> Back
          </Button>
          <div>
            <h1 className='text-xl font-bold tracking-tight'>
              {isNew
                ? 'Create New Coding Pattern'
                : `Edit Pattern: ${formData.title || 'Untitled'}`}
            </h1>
            <p className='text-xs text-muted-foreground font-mono'>
              {isNew ? 'New Pattern Draft' : `ID: ${patternId}`}
            </p>
          </div>
        </div>
      </div>

      {/* Wizard Step Indicator */}
      <div className='grid grid-cols-5 gap-2 border-b pb-4'>
        {STEPS.map((step) => {
          const active = currentStep === step.id;
          const completed = currentStep > step.id;
          return (
            <button
              key={step.id}
              onClick={() => {
                if (currentStep === 1 && step.id > 1 && !validateStep1()) {
                  return;
                }
                setCurrentStep(step.id);
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                active
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : completed
                    ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 opacity-60'
              }`}
            >
              <div className='flex items-center justify-between text-xs font-semibold'>
                <span>Step {step.id}</span>
                {completed && <Check className='w-3.5 h-3.5 text-emerald-600' />}
              </div>
              <div className='text-xs truncate font-medium mt-0.5'>{step.name}</div>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className='bg-card border rounded-xl p-6 shadow-sm min-h-[420px]'>
        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <div className='space-y-5 max-w-4xl'>
            <h2 className='text-lg font-semibold border-b pb-2'>
              Step 1: Basic Information & Oracle Engine
            </h2>

            <div className='space-y-2'>
              <Label>
                Pattern Title <span className='text-red-500'>*</span>
              </Label>
              <Input
                placeholder='e.g. Array Right Rotation by K Positions'
                value={formData.title}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('title', val);
                  if (
                    isNew &&
                    (!formData.slug ||
                      formData.slug ===
                        formData.title
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-|-$/g, ''))
                  ) {
                    handleChange(
                      'slug',
                      val
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, ''),
                    );
                  }
                }}
                className='w-full'
              />
            </div>

            <div className='space-y-2'>
              <Label>
                URL Slug <span className='text-red-500'>*</span>
              </Label>
              <Input
                placeholder='e.g. array-right-rotation'
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                className='w-full'
              />
            </div>

            {/* Topic & Concept Mapping */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>
                  Topic <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={formData.topicId || ''}
                  onValueChange={(val: string) => {
                    handleChange('topicId', val);
                    handleChange('conceptKey', '');
                  }}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select a topic...' />
                  </SelectTrigger>
                  <SelectContent>
                    {topicsList.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name || t.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>
                  Concept <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={formData.conceptKey || ''}
                  onValueChange={(val: string) => handleChange('conceptKey', val)}
                  disabled={!formData.topicId || formData.topicId === 'none'}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue
                      placeholder={
                        formData.topicId && formData.topicId !== 'none'
                          ? 'Select a concept...'
                          : 'Select a topic first'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {conceptsList.map((c: any) => (
                      <SelectItem key={c.id || c.code} value={c.code || c.conceptCode || c.id}>
                        {c.name || c.conceptName || c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dynamic Oracle Key Selector - Full Width */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label>
                  Oracle Engine Key <span className='text-red-500'>*</span>
                </Label>
                {loadingOracles && (
                  <span className='text-[10px] text-muted-foreground flex items-center gap-1'>
                    <Loader2 className='w-3 h-3 animate-spin' /> Fetching backend Oracles...
                  </span>
                )}
              </div>

              {oracleError ? (
                <div className='p-3 border border-red-200 rounded-md bg-red-50 text-red-700 text-xs flex items-center justify-between'>
                  <span>{oracleError}</span>
                  <Button size='sm' variant='outline' onClick={loadOracles} className='h-7 text-xs'>
                    <RefreshCw className='w-3 h-3 mr-1' /> Retry
                  </Button>
                </div>
              ) : (
                <Select
                  value={formData.oracleKey}
                  onValueChange={(val: string) => {
                    handleChange('oracleKey', val);
                    const selected = oracles.find((o) => o.key === val);
                    if (
                      selected &&
                      selected.parameterSchema &&
                      Object.keys(selected.parameterSchema).length > 0
                    ) {
                      handleChange(
                        'parameterSchema',
                        JSON.stringify(selected.parameterSchema, null, 2),
                      );
                    }
                  }}
                  disabled={loadingOracles || oracles.length === 0}
                >
                  <SelectTrigger className='w-full h-auto min-h-[44px] py-2 px-3'>
                    <SelectValue
                      placeholder={loadingOracles ? 'Loading Oracles...' : 'Select Oracle Engine'}
                    />
                  </SelectTrigger>
                  <SelectContent className='max-h-64 overflow-y-auto w-[var(--radix-select-trigger-width)]'>
                    {oracles.map((oracle) => (
                      <SelectItem key={oracle.key} value={oracle.key}>
                        <div className='flex items-center gap-2 flex-nowrap whitespace-nowrap'>
                          <span className='font-mono font-semibold text-[11px] text-primary shrink-0'>
                            {oracle.category}
                          </span>
                          <span className='font-medium'>
                            {oracle.name.replace(/\s+Oracle(\s+\(Legacy\))?$/i, '')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Selected Oracle Metadata Card */}
              {selectedOracle && (
                <div className='p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 text-xs space-y-1.5 mt-2'>
                  <div className='flex items-center gap-2'>
                    <Badge
                      variant='outline'
                      className='font-mono text-[10px] bg-primary/10 text-primary border-primary/30'
                    >
                      {selectedOracle.category}
                    </Badge>
                    <span className='font-semibold text-foreground'>{selectedOracle.name}</span>
                  </div>
                  {selectedOracle.description && (
                    <p className='text-muted-foreground'>{selectedOracle.description}</p>
                  )}
                  {selectedOracle.supportedDifficulties &&
                    selectedOracle.supportedDifficulties.length > 0 && (
                      <div className='flex items-center gap-1 pt-1'>
                        <span className='text-[11px] text-muted-foreground'>
                          Supported Difficulties:
                        </span>
                        {selectedOracle.supportedDifficulties.map((diff) => (
                          <Badge
                            key={diff}
                            variant='secondary'
                            className='text-[10px] px-1.5 py-0 font-mono'
                          >
                            {diff}
                          </Badge>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>
                  Target Difficulty <span className='text-red-500'>*</span>
                </Label>
                {(() => {
                  const supportedList = (selectedOracle?.supportedDifficulties || []).map((d) =>
                    String(d).toUpperCase(),
                  );
                  return (
                    <Select
                      value={formData.difficulty}
                      onValueChange={(val: string) => handleChange('difficulty', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['EASY', 'MEDIUM', 'HARD'].map((diff) => {
                          const isSupported =
                            supportedList.length === 0 || supportedList.includes(diff);
                          return (
                            <SelectItem
                              key={diff}
                              value={diff}
                              disabled={!isSupported}
                              className={!isSupported ? 'opacity-40 text-slate-400 cursor-not-allowed' : ''}
                            >
                              {diff} {!isSupported ? '(Not Supported)' : ''}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </div>

              <div className='space-y-2'>
                <Label>
                  Description <span className='text-xs text-muted-foreground font-normal'>(Optional)</span>
                </Label>
                <Input
                  placeholder='Short description of the pattern...'
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Problem Configuration */}
        {currentStep === 2 && (
          <div className='space-y-4'>
            <h2 className='text-lg font-semibold border-b pb-2'>
              Step 2: Schema Configuration (JSON)
            </h2>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <Label className='font-semibold'>Parameter Schema (Generator Controls)</Label>
                  {selectedOracle &&
                    selectedOracle.parameterSchema &&
                    Object.keys(selectedOracle.parameterSchema).length > 0 && (
                      <Button
                        size='sm'
                        variant='outline'
                        type='button'
                        className='h-7 text-[11px] gap-1 border-primary/40 text-primary hover:bg-primary/10'
                        onClick={() => {
                          if (selectedOracle.parameterSchema) {
                            handleChange(
                              'parameterSchema',
                              JSON.stringify(selectedOracle.parameterSchema, null, 2),
                            );
                          }
                        }}
                      >
                        <Sparkles className='w-3 h-3' /> Sync with {selectedOracle.name}
                      </Button>
                    )}
                </div>
                <div className='border rounded-md overflow-hidden'>
                  <Editor
                    height='240px'
                    defaultLanguage='json'
                    value={formData.parameterSchema}
                    onChange={(val?: string) => handleChange('parameterSchema', val || '')}
                    options={{ minimap: { enabled: false }, fontSize: 12 }}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label className='font-semibold'>Constraint Schema (Input Validation Bounds)</Label>
                <div className='border rounded-md overflow-hidden'>
                  <Editor
                    height='240px'
                    defaultLanguage='json'
                    value={formData.constraintSchema}
                    onChange={(val?: string) => handleChange('constraintSchema', val || '')}
                    options={{ minimap: { enabled: false }, fontSize: 12 }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Reference Solution */}
        {currentStep === 3 && (
          <div className='space-y-5'>
            <div className='flex items-center justify-between border-b pb-2'>
              <h2 className='text-lg font-semibold'>Step 3: Starter Code Skeletons</h2>
              <div className='flex items-center gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  type='button'
                  onClick={autoGenerateStarterCode}
                  className='h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10'
                >
                  <Sparkles className='w-3.5 h-3.5' /> Auto-Generate Skeletons
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  type='button'
                  onClick={() =>
                    setStarterCodeMode((prev) => (prev === 'visual' ? 'json' : 'visual'))
                  }
                  className='h-8 text-xs text-muted-foreground'
                >
                  {starterCodeMode === 'visual' ? 'Switch to Raw JSON' : 'Switch to Visual Tabs'}
                </Button>
              </div>
            </div>

            <div className='p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 text-xs text-muted-foreground flex items-center justify-between'>
              <div>
                Candidate solution evaluation is powered by{' '}
                <span className='font-mono font-semibold text-foreground'>
                  {formData.oracleKey || 'Selected Oracle'}
                </span>
                . Provide starter skeleton code for candidates below.
              </div>
            </div>

            {starterCodeMode === 'visual' ? (
              <div className='space-y-3'>
                {/* Language Tabs */}
                <div className='flex border-b gap-1 bg-muted/30 p-1 rounded-t-lg'>
                  {[
                    { id: 'python', label: 'Python 3', icon: 'PY' },
                    { id: 'java', label: 'Java', icon: 'JAVA' },
                    { id: 'cpp', label: 'C++', icon: 'C++' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      type='button'
                      onClick={() => setSelectedLanguageTab(lang.id as any)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                        selectedLanguageTab === lang.id
                          ? 'bg-background text-foreground shadow-sm font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className='font-mono text-[10px] opacity-70'>{lang.icon}</span>
                      {lang.label}
                    </button>
                  ))}
                </div>

                {/* Visual Editor for Active Language */}
                <div className='border rounded-b-lg overflow-hidden shadow-inner'>
                  <Editor
                    height='280px'
                    language={selectedLanguageTab}
                    value={getStarterCodeForLang(selectedLanguageTab)}
                    onChange={(val?: string) =>
                      updateStarterCodeForLang(selectedLanguageTab, val || '')
                    }
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: 'on',
                      tabSize: 4,
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className='space-y-2'>
                <Label className='font-semibold text-xs'>
                  Raw Starter Code Object (JSON per language)
                </Label>
                <div className='border rounded-md overflow-hidden'>
                  <Editor
                    height='280px'
                    defaultLanguage='json'
                    value={formData.starterCode}
                    onChange={(val?: string) => handleChange('starterCode', val || '')}
                    options={{ minimap: { enabled: false }, fontSize: 12 }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Preview & Validation */}
        {currentStep === 4 && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between border-b pb-2'>
              <h2 className='text-lg font-semibold'>
                Step 4: Realtime Materialization & Validation Preview
              </h2>
              <div className='flex items-center'>
                <div className='flex items-center space-x-2 mr-6'>
                  <input
                    type='checkbox'
                    id='generate-statement'
                    checked={generateStatement}
                    onChange={(e) => setGenerateStatement(e.target.checked)}
                    className='w-4 h-4 cursor-pointer rounded border-gray-300'
                    disabled={previewMutation.isPending}
                  />
                  <Label
                    htmlFor='generate-statement'
                    className='text-xs font-normal cursor-pointer text-muted-foreground'
                  >
                    Generate AI Problem Statement (slower)
                  </Label>
                </div>
                <Button
                  size='sm'
                  onClick={() => handleRunPreview(true)}
                  disabled={previewMutation.isPending || isOracleUnavailable}
                  title={
                    isOracleUnavailable
                      ? 'Cannot run preview when referenced Oracle is inactive or missing backend provider'
                      : ''
                  }
                  className='gap-2'
                >
                  {previewMutation.isPending ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    <RefreshCw className='w-4 h-4' />
                  )}
                  Regenerate Preview
                </Button>
              </div>
            </div>

            {previewMutation.isPending ? (
              <div className='p-12 flex flex-col items-center justify-center border border-dashed rounded-xl space-y-3 bg-slate-50/50 dark:bg-slate-900/50'>
                <Loader2 className='w-8 h-8 animate-spin text-primary' />
                <span className='text-sm font-semibold text-foreground'>
                  Generating realtime problem statement & test suites...
                </span>
                <span className='text-xs text-muted-foreground'>
                  Executing Oracle engine & synthesizing AI problem narrative
                </span>
              </div>
            ) : previewResult ? (
              <div className='space-y-6'>
                {/* Candidate Exam Simulation Card */}
                <div className='border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs bg-white dark:bg-slate-950'>
                  {/* Candidate Exam Header Bar */}
                  <div className='bg-slate-50 dark:bg-slate-900 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between'>
                    <div className='flex items-center gap-2.5'>
                      <Code2 className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
                      <h3 className='text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight font-sans'>
                        Question No 1: {formData.title || 'Coding Problem'}
                      </h3>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant='outline'
                        className='text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                      >
                        CODING
                      </Badge>
                      <Badge variant='secondary' className='text-[11px] font-semibold'>
                        {formData.difficulty}
                      </Badge>
                    </div>
                  </div>

                  {/* Candidate Problem Body */}
                  <div className='p-6 space-y-6 text-slate-800 dark:text-slate-200'>
                    {/* Problem Statement Markdown */}
                    <div className='space-y-2'>
                      <h4 className='text-[11px] font-bold tracking-wider uppercase text-slate-500 flex items-center gap-1.5'>
                        <FileText className='w-3.5 h-3.5 text-indigo-500' /> PROBLEM STATEMENT
                      </h4>
                      <div className='p-5 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm leading-relaxed font-sans'>
                        {previewResult.aiPreview?.narrative ? (
                          <MarkdownRenderer content={previewResult.aiPreview.narrative} />
                        ) : (
                          <p className='text-muted-foreground italic text-xs'>
                            No problem statement generated.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Candidate Instructions & Constraints Alert */}
                    <div className='p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 text-xs space-y-2'>
                      <div className='flex items-center gap-2 font-semibold text-blue-800 dark:text-blue-300'>
                        <Info className='w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400' />
                        <span className='text-xs uppercase tracking-wider'>
                          Candidate Instructions & Constraints
                        </span>
                      </div>
                      <p className='text-[12px] leading-relaxed text-blue-800/90 dark:text-blue-200/90 pl-6'>
                        Write an efficient algorithm to solve the problem. Ensure your solution
                        handles all edge cases and boundary conditions.
                      </p>
                      <div className='pl-6 pt-1 flex flex-wrap gap-2 text-[11px] font-mono'>
                        <span className='bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800'>
                          Time Limit: 2.0s
                        </span>
                        <span className='bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800'>
                          Memory Limit: 256MB
                        </span>
                        <span className='bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800'>
                          Complexity: Standard O(N) Time / O(1) Space
                        </span>
                      </div>
                    </div>

                    {/* Public Sample Test Cases */}
                    {previewResult.publicTests && previewResult.publicTests.length > 0 && (
                      <div className='space-y-3'>
                        <h4 className='text-[11px] font-bold tracking-wider uppercase text-slate-500 flex items-center gap-1.5'>
                          <Terminal className='w-3.5 h-3.5 text-emerald-500' /> PUBLIC SAMPLE TEST
                          CASES
                        </h4>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          {previewResult.publicTests.map((tc: any, index: number) => (
                            <div
                              key={`pub-tc-${index}`}
                              className='p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 space-y-2 text-xs'
                            >
                              <div className='flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400'>
                                <span>Sample Test Case #{index + 1}</span>
                                <Badge
                                  variant='outline'
                                  className='text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                                >
                                  Public
                                </Badge>
                              </div>
                              <div className='space-y-1 font-mono text-[11px]'>
                                <div className='text-muted-foreground text-[10px] uppercase font-bold'>
                                  Input
                                </div>
                                <pre className='p-2.5 bg-slate-900 text-slate-100 rounded-lg text-[11px] overflow-x-auto'>
                                  {JSON.stringify(tc.input, null, 2)}
                                </pre>
                              </div>
                              <div className='space-y-1 font-mono text-[11px]'>
                                <div className='text-muted-foreground text-[10px] uppercase font-bold'>
                                  Expected Output
                                </div>
                                <pre className='p-2.5 bg-slate-900 text-slate-100 rounded-lg text-[11px] overflow-x-auto'>
                                  {JSON.stringify(tc.expectedOutput, null, 2)}
                                </pre>
                              </div>
                              {tc.explanation && (
                                <p className='text-[11px] text-muted-foreground italic pt-1'>
                                  {tc.explanation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Test Suites Verification Matrix */}
                <div className='p-4 border rounded-xl bg-slate-50 dark:bg-slate-900/60 space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <ShieldCheck className='w-4 h-4 text-emerald-600' />
                      <span className='font-semibold text-xs text-foreground'>
                        Generated Test Case Matrix
                      </span>
                    </div>
                    <Badge
                      variant={previewResult.validation.valid ? 'default' : 'destructive'}
                      className='text-[11px]'
                    >
                      {previewResult.validation.valid
                        ? 'All Suites Validated'
                        : 'Validation Issues Detected'}
                    </Badge>
                  </div>
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs'>
                    <div className='p-3 border rounded-lg bg-background shadow-2xs'>
                      <div className='text-muted-foreground text-[10px] uppercase font-semibold'>
                        Public Tests
                      </div>
                      <div className='text-base font-bold text-foreground mt-1'>
                        {previewResult.publicTests.length}
                      </div>
                    </div>
                    <div className='p-3 border rounded-lg bg-background shadow-2xs'>
                      <div className='text-muted-foreground text-[10px] uppercase font-semibold'>
                        Hidden Tests
                      </div>
                      <div className='text-base font-bold text-foreground mt-1'>
                        {previewResult.hiddenTests.length}
                      </div>
                    </div>
                    <div className='p-3 border rounded-lg bg-background shadow-2xs'>
                      <div className='text-muted-foreground text-[10px] uppercase font-semibold'>
                        Stress Tests
                      </div>
                      <div className='text-base font-bold text-foreground mt-1'>
                        {previewResult.stressTests.length}
                      </div>
                    </div>
                    <div className='p-3 border rounded-lg bg-background shadow-2xs'>
                      <div className='text-muted-foreground text-[10px] uppercase font-semibold'>
                        Boundary Tests
                      </div>
                      <div className='text-base font-bold text-foreground mt-1'>
                        {previewResult.boundaryTests.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className='p-8 border border-dashed rounded-lg text-center text-muted-foreground text-xs'>
                Click <strong>Run Oracle Preview</strong> to generate test inputs, outputs, and
                validation metrics using the selected Oracle engine.
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Publish & Review All Details */}
        {currentStep === 5 && (
          <div className='space-y-6'>
            {/* Clean Header & Action Bar */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4'>
              <div>
                <h2 className='text-xl font-bold tracking-tight text-foreground'>
                  Review & Publish Pattern
                </h2>
                <p className='text-xs text-muted-foreground mt-0.5'>
                  Verify the question narrative, evaluation test suites, and configuration before publishing.
                </p>
              </div>

              <div className='flex items-center gap-2.5 shrink-0'>
                <Button
                  variant='outline'
                  size='sm'
                  className='text-xs h-9 px-4'
                  disabled={isSaving}
                  onClick={() => handleSave(false)}
                >
                  <Save className='w-3.5 h-3.5 mr-1.5' /> Save as Draft
                </Button>
                <Button
                  size='sm'
                  className='bg-primary text-primary-foreground text-xs font-semibold h-9 px-5'
                  disabled={isSaving || isOracleUnavailable}
                  onClick={() => handleSave(true)}
                >
                  {isSaving ? (
                    <Loader2 className='w-3.5 h-3.5 animate-spin mr-1.5' />
                  ) : (
                    <CheckCircle2 className='w-3.5 h-3.5 mr-1.5' />
                  )}
                  Publish Pattern
                </Button>
              </div>
            </div>

            {/* Overview Metric Cards Bar */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
              <div className='p-4 border rounded-xl bg-card shadow-2xs space-y-1'>
                <span className='text-[11px] text-muted-foreground font-medium uppercase tracking-wider block'>
                  Target Difficulty
                </span>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline' className='font-semibold text-xs'>
                    {formData.difficulty}
                  </Badge>
                  <Badge variant={formData.status === 'PUBLISHED' ? 'default' : 'secondary'} className='text-[10px]'>
                    {formData.status}
                  </Badge>
                </div>
              </div>

              <div className='p-4 border rounded-xl bg-card shadow-2xs space-y-1'>
                <span className='text-[11px] text-muted-foreground font-medium uppercase tracking-wider block'>
                  Topic & Concept
                </span>
                <p className='text-xs font-semibold text-foreground truncate'>
                  {topicsList.find((t: any) => t.id === formData.topicId)?.name || 'General'}
                  <span className='text-muted-foreground font-normal ml-1 font-mono text-[11px]'>
                    ({formData.conceptKey || 'CODING'})
                  </span>
                </p>
              </div>

              <div className='p-4 border rounded-xl bg-card shadow-2xs space-y-1'>
                <span className='text-[11px] text-muted-foreground font-medium uppercase tracking-wider block'>
                  Oracle Engine
                </span>
                <p className='text-xs font-semibold text-primary truncate' title={selectedOracle?.name || formData.oracleKey}>
                  {selectedOracle?.name ? selectedOracle.name.replace(/\s+Oracle(\s+\(Legacy\))?$/i, '') : formData.oracleKey || 'None'}
                </p>
              </div>

              <div className='p-4 border rounded-xl bg-card shadow-2xs space-y-1'>
                <span className='text-[11px] text-muted-foreground font-medium uppercase tracking-wider block'>
                  Verified Test Suites
                </span>
                <p className='text-xs font-semibold text-foreground'>
                  {previewResult ? (
                    <span>
                      <strong className='text-emerald-600 dark:text-emerald-400'>
                        {previewResult.publicTests.length + previewResult.hiddenTests.length + previewResult.stressTests.length + previewResult.boundaryTests.length}
                      </strong>{' '}
                      Cases Total
                    </span>
                  ) : (
                    <span className='text-muted-foreground italic font-normal'>Pending execution</span>
                  )}
                </p>
              </div>
            </div>

            {/* Generated Problem Statement (Exam View) */}
            <div className='border rounded-xl bg-card overflow-hidden shadow-2xs'>
              <div className='px-5 py-3.5 bg-muted/40 border-b flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <FileText className='w-4 h-4 text-primary' />
                  <h3 className='font-semibold text-sm text-foreground'>Generated Problem Statement</h3>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline' className='text-[11px] font-medium bg-background'>
                    <Sparkles className='w-3 h-3 mr-1 text-primary' /> AI Generated
                  </Badge>
                  <Badge variant='secondary' className='text-[11px]'>
                    CODING
                  </Badge>
                </div>
              </div>

              <div className='p-6 text-sm leading-relaxed font-sans'>
                {previewResult?.aiPreview?.narrative ? (
                  <MarkdownRenderer content={previewResult.aiPreview.narrative} />
                ) : (
                  <div className='text-muted-foreground italic text-xs py-2'>
                    Problem statement narrative will be automatically generated upon preview execution or publication.
                  </div>
                )}
              </div>
            </div>

            {/* Two-Column Specification & Test Breakdown */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Test Suites Type-Wise Matrix */}
              <div className='border rounded-xl bg-card p-5 space-y-4 shadow-2xs'>
                <div className='flex items-center justify-between border-b pb-3'>
                  <div className='flex items-center gap-2'>
                    <ShieldCheck className='w-4 h-4 text-emerald-600 dark:text-emerald-400' />
                    <h3 className='font-semibold text-sm text-foreground'>Test Suites Breakdown</h3>
                  </div>
                  {previewResult && (
                    <Badge variant='outline' className='font-mono text-[11px]'>
                      {previewResult.publicTests.length + previewResult.hiddenTests.length + previewResult.stressTests.length + previewResult.boundaryTests.length} cases
                    </Badge>
                  )}
                </div>

                {previewResult ? (
                  <div className='grid grid-cols-2 gap-3 text-xs'>
                    <div className='p-3.5 rounded-lg border bg-muted/20 space-y-1'>
                      <div className='flex justify-between items-center'>
                        <span className='font-semibold text-foreground flex items-center gap-1.5'>
                          <Terminal className='w-3.5 h-3.5 text-emerald-600' /> Public Tests
                        </span>
                        <Badge variant='secondary' className='font-mono text-xs font-semibold'>
                          {previewResult.publicTests.length}
                        </Badge>
                      </div>
                      <p className='text-[11px] text-muted-foreground'>Visible sample cases for candidates</p>
                    </div>

                    <div className='p-3.5 rounded-lg border bg-muted/20 space-y-1'>
                      <div className='flex justify-between items-center'>
                        <span className='font-semibold text-foreground flex items-center gap-1.5'>
                          <ShieldCheck className='w-3.5 h-3.5 text-blue-600' /> Hidden Tests
                        </span>
                        <Badge variant='secondary' className='font-mono text-xs font-semibold'>
                          {previewResult.hiddenTests.length}
                        </Badge>
                      </div>
                      <p className='text-[11px] text-muted-foreground'>Automated evaluation test cases</p>
                    </div>

                    <div className='p-3.5 rounded-lg border bg-muted/20 space-y-1'>
                      <div className='flex justify-between items-center'>
                        <span className='font-semibold text-foreground flex items-center gap-1.5'>
                          <Cpu className='w-3.5 h-3.5 text-amber-600' /> Stress Tests
                        </span>
                        <Badge variant='secondary' className='font-mono text-xs font-semibold'>
                          {previewResult.stressTests.length}
                        </Badge>
                      </div>
                      <p className='text-[11px] text-muted-foreground'>High volume complexity tests</p>
                    </div>

                    <div className='p-3.5 rounded-lg border bg-muted/20 space-y-1'>
                      <div className='flex justify-between items-center'>
                        <span className='font-semibold text-foreground flex items-center gap-1.5'>
                          <Sliders className='w-3.5 h-3.5 text-purple-600' /> Boundary Tests
                        </span>
                        <Badge variant='secondary' className='font-mono text-xs font-semibold'>
                          {previewResult.boundaryTests.length}
                        </Badge>
                      </div>
                      <p className='text-[11px] text-muted-foreground'>Edge and extremity test bounds</p>
                    </div>
                  </div>
                ) : (
                  <p className='text-xs text-muted-foreground italic py-4 text-center'>
                    Run preview to display test suite breakdown.
                  </p>
                )}
              </div>

              {/* Starter Code Skeleton Preview */}
              <div className='border rounded-xl bg-card p-5 space-y-4 shadow-2xs'>
                <div className='flex items-center justify-between border-b pb-3'>
                  <div className='flex items-center gap-2'>
                    <Code2 className='w-4 h-4 text-primary' />
                    <h3 className='font-semibold text-sm text-foreground'>Starter Code Skeletons</h3>
                  </div>
                  <div className='flex items-center gap-1 bg-muted p-0.5 rounded-md'>
                    {[
                      { id: 'python', label: 'Python' },
                      { id: 'java', label: 'Java' },
                      { id: 'cpp', label: 'C++' },
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        type='button'
                        onClick={() => setSelectedLanguageTab(lang.id as any)}
                        className={`px-2.5 py-0.5 text-xs font-medium rounded transition-all ${
                          selectedLanguageTab === lang.id
                            ? 'bg-background text-foreground shadow-2xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className='border rounded-lg overflow-hidden'>
                  <Editor
                    height='160px'
                    language={selectedLanguageTab}
                    value={getStarterCodeForLang(selectedLanguageTab)}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineNumbers: 'on',
                      tabSize: 4,
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className='flex items-center justify-between border-t pt-4'>
        <Button
          variant='outline'
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft className='w-4 h-4 mr-1' /> Previous
        </Button>

        {currentStep < 5 && (
          <Button
            onClick={() => {
              if (currentStep === 1 && !validateStep1()) {
                return;
              }
              setCurrentStep((prev) => Math.min(5, prev + 1));
            }}
          >
            Next <ArrowRight className='w-4 h-4 ml-1' />
          </Button>
        )}
      </div>
    </div>
  );
}
