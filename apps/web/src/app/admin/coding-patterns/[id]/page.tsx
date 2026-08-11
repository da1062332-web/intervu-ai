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
} from 'lucide-react';
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
    parameterSchema: JSON.stringify({ arraySize: { type: 'integer', min: 5, max: 15 }, k: { type: 'integer', min: 1, max: 10 } }, null, 2),
    constraintSchema: JSON.stringify({ arr: { minSize: 1, maxSize: 100 } }, null, 2),
    starterCode: JSON.stringify({ python: 'def rotate(arr, k):\n    pass\n', javascript: 'function rotate(arr, k) {\n    return [];\n}\n' }, null, 2),
  });

  const { data: topicsData } = useTopics();
  const topicsList = Array.isArray(topicsData) ? topicsData : (topicsData as any)?.items || [];

  const { data: conceptsData } = useConcepts(formData.topicId && formData.topicId !== 'none' ? formData.topicId : '');
  const conceptsList = Array.isArray(conceptsData) ? conceptsData : (conceptsData as any)?.items || [];

  const [previewResult, setPreviewResult] = useState<PatternPreviewResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLanguageTab, setSelectedLanguageTab] = useState<'javascript' | 'python' | 'java' | 'cpp'>('javascript');
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
    if (formData.oracleKey === 'MATH_PRIME_CHECK_ORACLE') {
      const defaultCode = {
        python: 'def is_prime(n):\n    # Return True if n is prime, else False\n    pass\n',
        javascript: 'function isPrime(n) {\n    // Return true if n is prime, else false\n    return false;\n}\n',
        java: 'class Solution {\n    public boolean isPrime(int n) {\n        return false;\n    }\n}\n',
        cpp: 'bool isPrime(int n) {\n    return false;\n}\n',
      };
      handleChange('starterCode', JSON.stringify(defaultCode, null, 2));
    } else {
      const defaultCode = {
        python: 'def solve(input_data):\n    pass\n',
        javascript: 'function solve(inputData) {\n    return null;\n}\n',
        java: 'class Solution {\n    public Object solve() {\n        return null;\n    }\n}\n',
        cpp: 'auto solve() {\n    return 0;\n}\n',
      };
      handleChange('starterCode', JSON.stringify(defaultCode, null, 2));
    }
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
        statementSpecification: JSON.stringify(existingPattern.statementSpecification || {}, null, 2),
        parameterSchema: JSON.stringify(existingPattern.parameterSchema || {}, null, 2),
        constraintSchema: JSON.stringify(existingPattern.constraintSchema || {}, null, 2),
        starterCode: JSON.stringify(existingPattern.starterCode || {}, null, 2),
      }));
    }
  }, [existingPattern, isNew, queryTopicId, queryConceptKey]);

  // Auto-sync parameterSchema with selected Oracle if empty or matching default placeholder
  useEffect(() => {
    const selectedOracle = oracles.find((o) => o.key === formData.oracleKey);
    if (selectedOracle && selectedOracle.parameterSchema && Object.keys(selectedOracle.parameterSchema).length > 0) {
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
  }, [oracles, formData.oracleKey]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRunPreview = async () => {
    try {
      const payload = {
        patternId: isNew ? undefined : patternId,
        oracleKey: formData.oracleKey,
        parameterSchema: JSON.parse(formData.parameterSchema || '{}'),
        constraintSchema: JSON.parse(formData.constraintSchema || '{}'),
        seed: (() => {
          const str = formData.oracleKey || '';
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
          }
          return Math.abs(hash % 90000) + 10000;
        })(),
      };
      const res = await previewMutation.mutateAsync(payload);
      setPreviewResult(res);
    } catch (err: any) {
      alert(`Preview generation failed: ${err.message}`);
    }
  };

  const handleSave = async (publish: boolean = false) => {
    setIsSaving(true);
    try {
      const payload = {
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: formData.description,
        difficulty: formData.difficulty as any,
        status: (publish ? 'PUBLISHED' : formData.status) as any,
        version: Number(formData.version),
        oracleKey: formData.oracleKey,
        statementSpecification: JSON.parse(formData.statementSpecification || '{}'),
        parameterSchema: JSON.parse(formData.parameterSchema || '{}'),
        constraintSchema: JSON.parse(formData.constraintSchema || '{}'),
        starterCode: JSON.parse(formData.starterCode || '{}'),
        metadata: {
          ...((existingPattern?.metadata as any) || {}),
          topicId: formData.topicId && formData.topicId !== 'none' ? formData.topicId : undefined,
          conceptKey: formData.conceptKey && formData.conceptKey !== 'none' ? formData.conceptKey : undefined,
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
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading Coding Pattern...
        </div>
      </div>
    );
  }

  const selectedOracle = oracles.find((o) => o.key === formData.oracleKey);
  const isOracleInactive = selectedOracle && selectedOracle.isActive === false;
  const isOracleProviderMissing = selectedOracle && selectedOracle.isProviderAvailable === false;
  const isOracleUnavailable = Boolean(isOracleInactive || isOracleProviderMissing);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto pb-24">
      {/* Oracle Warning Banner */}
      {isOracleUnavailable && (
        <div className="p-4 border border-red-300 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <span className="font-semibold text-sm block">Referenced Oracle is Unavailable</span>
              <p className="text-xs text-red-700 dark:text-red-300">
                {isOracleInactive && `Oracle "${selectedOracle?.name}" (${selectedOracle?.key}) is set to INACTIVE by admin.`}
                {isOracleProviderMissing && `Oracle "${selectedOracle?.name}" (${selectedOracle?.key}) has no registered executable backend provider.`}
                {' '}Draft saving is permitted, but Pattern Preview and Publishing are strictly disabled until the Oracle is active and registered.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push('/admin/coding-oracles')}
            className="text-xs shrink-0 border-red-300 hover:bg-red-100"
          >
            Manage Oracles
          </Button>
        </div>
      )}

      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/coding-patterns')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {isNew ? 'Create New Coding Pattern' : `Edit Pattern: ${formData.title || 'Untitled'}`}
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              {isNew ? 'New Pattern Draft' : `ID: ${patternId}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={isSaving}>
            <Save className="w-4 h-4 mr-1" /> Save Draft
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave(true)}
            disabled={isSaving || isOracleUnavailable}
            title={isOracleUnavailable ? 'Cannot publish pattern when referenced Oracle is inactive or missing backend provider' : ''}
            className="gap-1"
          >
            <CheckCircle2 className="w-4 h-4" /> Publish Pattern
          </Button>
        </div>
      </div>

      {/* Wizard Step Indicator */}
      <div className="grid grid-cols-5 gap-2 border-b pb-4">
        {STEPS.map((step) => {
          const active = currentStep === step.id;
          const completed = currentStep > step.id;
          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                active
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : completed
                  ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Step {step.id}</span>
                {completed && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <div className="text-xs truncate font-medium mt-0.5">{step.name}</div>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-card border rounded-xl p-6 shadow-sm min-h-[420px]">
        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-5 max-w-4xl">
            <h2 className="text-lg font-semibold border-b pb-2">Step 1: Basic Information & Oracle Engine</h2>
            
            <div className="space-y-2">
              <Label>Pattern Title</Label>
              <Input
                placeholder="e.g. Array Right Rotation by K Positions"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>URL Slug</Label>
              <Input
                placeholder="e.g. array-right-rotation"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Topic & Concept Mapping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Topic (optional)</Label>
                <Select
                  value={formData.topicId || 'none'}
                  onValueChange={(val: string) => {
                    handleChange('topicId', val === 'none' ? '' : val);
                    handleChange('conceptKey', '');
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a topic..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- No Topic --</SelectItem>
                    {topicsList.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name || t.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Concept (optional)</Label>
                <Select
                  value={formData.conceptKey || 'none'}
                  onValueChange={(val: string) => handleChange('conceptKey', val === 'none' ? '' : val)}
                  disabled={!formData.topicId || formData.topicId === 'none'}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        formData.topicId && formData.topicId !== 'none'
                          ? 'Select a concept...'
                          : 'Select a topic first'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- No Concept --</SelectItem>
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Oracle Engine Key</Label>
                {loadingOracles && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Fetching backend Oracles...
                  </span>
                )}
              </div>

              {oracleError ? (
                <div className="p-3 border border-red-200 rounded-md bg-red-50 text-red-700 text-xs flex items-center justify-between">
                  <span>{oracleError}</span>
                  <Button size="sm" variant="outline" onClick={loadOracles} className="h-7 text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" /> Retry
                  </Button>
                </div>
              ) : (
                <Select
                  value={formData.oracleKey}
                  onValueChange={(val: string) => {
                    handleChange('oracleKey', val);
                    const selected = oracles.find((o) => o.key === val);
                    if (selected && selected.parameterSchema && Object.keys(selected.parameterSchema).length > 0) {
                      handleChange('parameterSchema', JSON.stringify(selected.parameterSchema, null, 2));
                    }
                  }}
                  disabled={loadingOracles || oracles.length === 0}
                >
                  <SelectTrigger className="w-full h-auto min-h-[44px] py-2 px-3">
                    <SelectValue placeholder={loadingOracles ? 'Loading Oracles...' : 'Select Oracle Engine'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto w-[var(--radix-select-trigger-width)]">
                    {oracles.map((oracle) => (
                      <SelectItem key={oracle.key} value={oracle.key}>
                        <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
                          <span className="font-mono font-semibold text-[11px] text-primary shrink-0">
                            {oracle.category}
                          </span>
                          <span className="font-medium">{oracle.name}</span>
                          <span className="text-muted-foreground text-[10px] font-mono shrink-0">({oracle.key})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

                {/* Selected Oracle Metadata Card */}
                {selectedOracle && (
                  <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 text-xs space-y-1.5 mt-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/30">
                        {selectedOracle.category}
                      </Badge>
                      <span className="font-semibold text-foreground">{selectedOracle.name}</span>
                    </div>
                    {selectedOracle.description && (
                      <p className="text-muted-foreground">{selectedOracle.description}</p>
                    )}
                    {selectedOracle.supportedDifficulties && selectedOracle.supportedDifficulties.length > 0 && (
                      <div className="flex items-center gap-1 pt-1">
                        <span className="text-[11px] text-muted-foreground">Supported Difficulties:</span>
                        {selectedOracle.supportedDifficulties.map((diff) => (
                          <Badge key={diff} variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                            {diff}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(val: string) => handleChange('difficulty', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">EASY</SelectItem>
                    <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                    <SelectItem value="HARD">HARD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Short description of the pattern..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Problem Configuration */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Step 2: Schema Configuration (JSON)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Parameter Schema (Generator Controls)</Label>
                  {selectedOracle && selectedOracle.parameterSchema && Object.keys(selectedOracle.parameterSchema).length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      className="h-7 text-[11px] gap-1 border-primary/40 text-primary hover:bg-primary/10"
                      onClick={() => {
                        if (selectedOracle.parameterSchema) {
                          handleChange('parameterSchema', JSON.stringify(selectedOracle.parameterSchema, null, 2));
                        }
                      }}
                    >
                      <Sparkles className="w-3 h-3" /> Sync with {selectedOracle.name}
                    </Button>
                  )}
                </div>
                <div className="border rounded-md overflow-hidden">
                  <Editor
                    height="240px"
                    defaultLanguage="json"
                    value={formData.parameterSchema}
                    onChange={(val?: string) => handleChange('parameterSchema', val || '')}
                    options={{ minimap: { enabled: false }, fontSize: 12 }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Constraint Schema (Input Validation Bounds)</Label>
                <div className="border rounded-md overflow-hidden">
                  <Editor
                    height="240px"
                    defaultLanguage="json"
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
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-lg font-semibold">Step 3: Starter Code Skeletons</h2>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={autoGenerateStarterCode}
                  className="h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Auto-Generate Skeletons
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => setStarterCodeMode((prev) => (prev === 'visual' ? 'json' : 'visual'))}
                  className="h-8 text-xs text-muted-foreground"
                >
                  {starterCodeMode === 'visual' ? 'Switch to Raw JSON' : 'Switch to Visual Tabs'}
                </Button>
              </div>
            </div>

            <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 text-xs text-muted-foreground flex items-center justify-between">
              <div>
                Candidate solution evaluation is powered by{' '}
                <span className="font-mono font-semibold text-foreground">{formData.oracleKey || 'Selected Oracle'}</span>.
                Provide starter skeleton code for candidates below.
              </div>
            </div>

            {starterCodeMode === 'visual' ? (
              <div className="space-y-3">
                {/* Language Tabs */}
                <div className="flex border-b gap-1 bg-muted/30 p-1 rounded-t-lg">
                  {[
                    { id: 'javascript', label: 'JavaScript (Node.js)', icon: 'JS' },
                    { id: 'python', label: 'Python 3', icon: 'PY' },
                    { id: 'java', label: 'Java', icon: 'JAVA' },
                    { id: 'cpp', label: 'C++', icon: 'C++' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setSelectedLanguageTab(lang.id as any)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                        selectedLanguageTab === lang.id
                          ? 'bg-background text-foreground shadow-sm font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="font-mono text-[10px] opacity-70">{lang.icon}</span>
                      {lang.label}
                    </button>
                  ))}
                </div>

                {/* Visual Editor for Active Language */}
                <div className="border rounded-b-lg overflow-hidden shadow-inner">
                  <Editor
                    height="280px"
                    language={selectedLanguageTab}
                    value={getStarterCodeForLang(selectedLanguageTab)}
                    onChange={(val?: string) => updateStarterCodeForLang(selectedLanguageTab, val || '')}
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
              <div className="space-y-2">
                <Label className="font-semibold text-xs">Raw Starter Code Object (JSON per language)</Label>
                <div className="border rounded-md overflow-hidden">
                  <Editor
                    height="280px"
                    defaultLanguage="json"
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
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-lg font-semibold">Step 4: Realtime Materialization & Validation Preview</h2>
              <Button
                size="sm"
                onClick={handleRunPreview}
                disabled={previewMutation.isPending || isOracleUnavailable}
                title={isOracleUnavailable ? 'Cannot run preview when referenced Oracle is inactive or missing backend provider' : ''}
                className="gap-2"
              >
                {previewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                Run Oracle Preview
              </Button>
            </div>

            {previewResult ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant={previewResult.validation.valid ? 'default' : 'destructive'}>
                    {previewResult.validation.valid ? 'Valid Execution' : 'Validation Errors Detected'}
                  </Badge>
                  {previewResult.validation.warnings.length > 0 && (
                    <Badge variant="outline" className="border-amber-400 text-amber-600">
                      {previewResult.validation.warnings.length} Warning(s)
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded bg-slate-900 text-slate-100 font-mono space-y-1">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Generated Input</div>
                    <pre className="overflow-x-auto">{JSON.stringify(previewResult.generatedInput, null, 2)}</pre>
                  </div>
                  <div className="p-3 border rounded bg-slate-900 text-slate-100 font-mono space-y-1">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Expected Output</div>
                    <pre className="overflow-x-auto">{JSON.stringify(previewResult.expectedOutput, null, 2)}</pre>
                  </div>
                </div>

                <div className="p-3 border rounded bg-slate-50 dark:bg-slate-900">
                  <div className="font-semibold mb-1">Generated Test Suites</div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="p-2 border rounded bg-background">Public Tests: {previewResult.publicTests.length}</div>
                    <div className="p-2 border rounded bg-background">Hidden Tests: {previewResult.hiddenTests.length}</div>
                    <div className="p-2 border rounded bg-background">Stress Tests: {previewResult.stressTests.length}</div>
                    <div className="p-2 border rounded bg-background">Boundary Tests: {previewResult.boundaryTests.length}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground text-xs">
                Click <strong>Run Oracle Preview</strong> to generate test inputs, outputs, and validation metrics using the selected Oracle engine.
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Publish */}
        {currentStep === 5 && (
          <div className="space-y-6 max-w-xl">
            <h2 className="text-lg font-semibold border-b pb-2">Step 5: Review & Publish</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b py-2">
                <span className="text-muted-foreground">Title:</span>
                <span className="font-semibold">{formData.title || 'Untitled'}</span>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="text-muted-foreground">Oracle Key:</span>
                <span className="font-mono">{formData.oracleKey || 'None'}</span>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="text-muted-foreground">Difficulty:</span>
                <Badge variant="outline">{formData.difficulty}</Badge>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge>{formData.status}</Badge>
              </div>
            </div>
            <div className="pt-4 flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => handleSave(false)}>
                Save as Draft
              </Button>
              <Button className="flex-1 gap-2" onClick={() => handleSave(true)}>
                <CheckCircle2 className="w-4 h-4" /> Publish Now
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Previous
        </Button>

        {currentStep < 5 && (
          <Button onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}>
            Next <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
