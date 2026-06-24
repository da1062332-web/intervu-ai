'use client';

import { useState } from 'react';
import { useConfigs } from '@/services/exam-configs';
import { useSystemValidation, runSystemValidation } from '@/services/system-validation';
import { useSystemValidationStore } from '@/store/system-validation.store';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Play,
  Loader2,
  Info,
} from 'lucide-react';

export default function SystemValidationPage() {
  const { data: configs, isLoading: isConfigsLoading, isError: isConfigsError } = useConfigs();
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');

  // React Query validation hooks
  const { refetch, isFetching: isQueryFetching } = useSystemValidation(selectedConfigId);
  const { mutate: runValidation, isPending: isMutatePending } =
    runSystemValidation(selectedConfigId);

  // Zustand Store state
  const { validationResult, score, errors, loading } = useSystemValidationStore();
  const isLoading = loading || isQueryFetching || isMutatePending;

  // Accordion open/collapsed state for the 4 layers in Error Explorer
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({
    configuration: true,
    knowledge: true,
    templates: true,
    blueprint: true,
  });

  const toggleLayer = (layer: string) => {
    setExpandedLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  const handleRunValidation = () => {
    if (!selectedConfigId) return;
    runValidation();
  };

  const getStatusColor = (status: 'PASS' | 'FAIL' | 'WARNING') => {
    switch (status) {
      case 'PASS':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'FAIL':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'WARNING':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    }
  };

  const getStatusIcon = (status: 'PASS' | 'FAIL' | 'WARNING') => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className='w-5 h-5 text-emerald-500' />;
      case 'FAIL':
        return <XCircle className='w-5 h-5 text-rose-500' />;
      case 'WARNING':
        return <AlertTriangle className='w-5 h-5 text-amber-500' />;
    }
  };

  const getScoreColor = (val: number) => {
    if (val === 100) return 'text-emerald-500 stroke-emerald-500';
    if (val >= 50) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8'>
      {/* Page Header */}
      <div className='flex flex-col gap-2 border-b border-border pb-5'>
        <h1 className='font-heading font-bold text-3xl tracking-tight text-foreground flex items-center gap-3'>
          <ShieldCheck className='w-8 h-8 text-primary' />
          Cross-Module System Validation
        </h1>
        <p className='text-muted-foreground text-sm max-w-2xl'>
          Verify configuration chain integrity from Exam Config and Sections to Topics, Templates,
          Blueprints, and Readiness status before dispatching to generation modules.
        </p>
      </div>

      {/* Configuration Selection Control */}
      <Card className='backdrop-blur-md bg-white/60 dark:bg-gray-950/60 border border-white/20 dark:border-white/10 shadow-sm rounded-xl'>
        <CardContent className='p-6 flex flex-col sm:flex-row items-end gap-4'>
          <div className='flex-1 space-y-2'>
            <label
              htmlFor='config-select'
              className='text-sm font-semibold text-foreground flex items-center gap-1.5'
            >
              <Info className='w-4 h-4 text-muted-foreground' />
              Select Exam Configuration
            </label>
            {isConfigsLoading ? (
              <Skeleton className='h-10 w-full rounded-md' />
            ) : isConfigsError ? (
              <div className='text-rose-500 text-sm'>Failed to load exam configurations.</div>
            ) : (
              <select
                id='config-select'
                value={selectedConfigId}
                onChange={(e) => {
                  setSelectedConfigId(e.target.value);
                  useSystemValidationStore.getState().reset();
                }}
                className='w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
              >
                <option value=''>-- Choose a configuration --</option>
                {configs?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            )}
          </div>
          <Button
            onClick={handleRunValidation}
            disabled={!selectedConfigId || isLoading}
            className='w-full sm:w-auto h-10 px-5 text-sm font-semibold flex items-center justify-center gap-2'
          >
            {isLoading ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <Play className='w-4 h-4 fill-current' />
            )}
            Run Full Validation
          </Button>
        </CardContent>
      </Card>

      {/* Main Validation Dashboard */}
      {selectedConfigId && (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left Column: Visual Score Gauge */}
          <div className='lg:col-span-1 space-y-6'>
            <Card className='backdrop-blur-md bg-white/60 dark:bg-gray-950/60 border border-white/20 dark:border-white/10 shadow-sm rounded-xl flex flex-col items-center justify-center p-8 text-center min-h-[350px]'>
              <CardHeader className='w-full text-center pb-2'>
                <CardTitle className='text-lg font-semibold text-muted-foreground'>
                  Validation Score
                </CardTitle>
              </CardHeader>
              <CardContent className='flex flex-col items-center justify-center space-y-4'>
                {isLoading ? (
                  <div className='flex flex-col items-center justify-center space-y-4'>
                    <Loader2 className='w-16 h-16 text-primary animate-spin' />
                    <p className='text-sm font-medium text-muted-foreground'>
                      Auditing system integrity...
                    </p>
                  </div>
                ) : !validationResult ? (
                  <div className='flex flex-col items-center justify-center space-y-4 py-8'>
                    <div className='w-24 h-24 rounded-full border-4 border-dashed border-muted flex items-center justify-center'>
                      <ShieldCheck className='w-10 h-10 text-muted-foreground' />
                    </div>
                    <p className='text-sm text-muted-foreground max-w-[200px]'>
                      Click validation button to start check
                    </p>
                  </div>
                ) : (
                  <>
                    {/* SVG Circular Gauge */}
                    <div className='relative w-40 h-40'>
                      <svg className='w-full h-full transform -rotate-90' viewBox='0 0 100 100'>
                        {/* Background track */}
                        <circle
                          cx='50'
                          cy='50'
                          r='40'
                          className='stroke-muted fill-none'
                          strokeWidth='8'
                        />
                        {/* Fill indicator */}
                        <circle
                          cx='50'
                          cy='50'
                          r='40'
                          className={`fill-none transition-all duration-1000 ease-in-out ${getScoreColor(score)}`}
                          strokeWidth='8'
                          strokeDasharray='251.2'
                          strokeDashoffset={251.2 - (251.2 * score) / 100}
                          strokeLinecap='round'
                        />
                      </svg>
                      {/* Central label */}
                      <div className='absolute inset-0 flex flex-col items-center justify-center'>
                        <span className='text-4xl font-extrabold tracking-tight text-foreground'>
                          {score}
                        </span>
                        <span className='text-[10px] uppercase font-bold text-muted-foreground'>
                          out of 100
                        </span>
                      </div>
                    </div>

                    <div className='space-y-1'>
                      <p className='font-semibold text-lg text-foreground'>
                        {score === 100
                          ? 'System Fully Ready'
                          : score >= 50
                            ? 'Partially Configured'
                            : 'Configuration Broken'}
                      </p>
                      <p className='text-xs text-muted-foreground px-4'>
                        {score === 100
                          ? 'This configuration matches all required constraints and is 100% ready for question generation.'
                          : 'Please review the error breakdown below to resolve outstanding config issues.'}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Layer Status Breakdown */}
          <div className='lg:col-span-2 space-y-6'>
            <h3 className='font-heading font-semibold text-lg text-foreground'>
              Validation Layers Breakdown
            </h3>

            {isLoading ? (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className='h-28 w-full rounded-xl' />
                ))}
              </div>
            ) : !validationResult ? (
              <div className='border border-dashed rounded-xl py-16 text-center text-muted-foreground text-sm backdrop-blur-md bg-white/40 dark:bg-gray-950/40'>
                No active validation results. Select a config above and click validate.
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {/* 1. Configuration Layer */}
                <Card className='backdrop-blur-md bg-white/60 dark:bg-gray-950/60 border border-white/20 dark:border-white/10 shadow-sm rounded-xl'>
                  <CardContent className='p-5 flex items-start gap-4'>
                    <div className='p-2.5 rounded-lg border bg-background shrink-0'>
                      {getStatusIcon(validationResult.breakdown?.configuration.status || 'FAIL')}
                    </div>
                    <div className='space-y-1 min-w-0 flex-1'>
                      <div className='flex items-center justify-between gap-2'>
                        <span className='text-sm font-bold text-foreground truncate'>
                          Configuration Layer
                        </span>
                        <Badge
                          className={getStatusColor(
                            validationResult.breakdown?.configuration.status || 'FAIL',
                          )}
                        >
                          {validationResult.breakdown?.configuration.status}
                        </Badge>
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Checks exam parameters, active sections, rule flags, and difficulty splits.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Knowledge Layer */}
                <Card className='backdrop-blur-md bg-white/60 dark:bg-gray-950/60 border border-white/20 dark:border-white/10 shadow-sm rounded-xl'>
                  <CardContent className='p-5 flex items-start gap-4'>
                    <div className='p-2.5 rounded-lg border bg-background shrink-0'>
                      {getStatusIcon(validationResult.breakdown?.knowledge.status || 'FAIL')}
                    </div>
                    <div className='space-y-1 min-w-0 flex-1'>
                      <div className='flex items-center justify-between gap-2'>
                        <span className='text-sm font-bold text-foreground truncate'>
                          Knowledge Layer
                        </span>
                        <Badge
                          className={getStatusColor(
                            validationResult.breakdown?.knowledge.status || 'FAIL',
                          )}
                        >
                          {validationResult.breakdown?.knowledge.status}
                        </Badge>
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Verifies topic mappings, concept dependencies, and section weightages.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Template Layer */}
                <Card className='backdrop-blur-md bg-white/60 dark:bg-gray-950/60 border border-white/20 dark:border-white/10 shadow-sm rounded-xl'>
                  <CardContent className='p-5 flex items-start gap-4'>
                    <div className='p-2.5 rounded-lg border bg-background shrink-0'>
                      {getStatusIcon(validationResult.breakdown?.templates.status || 'FAIL')}
                    </div>
                    <div className='space-y-1 min-w-0 flex-1'>
                      <div className='flex items-center justify-between gap-2'>
                        <span className='text-sm font-bold text-foreground truncate'>
                          Template Layer
                        </span>
                        <Badge
                          className={getStatusColor(
                            validationResult.breakdown?.templates.status || 'FAIL',
                          )}
                        >
                          {validationResult.breakdown?.templates.status}
                        </Badge>
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Audits dynamic template schema counts, variables, range rules, and
                        solutions.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Blueprint Layer */}
                <Card className='backdrop-blur-md bg-white/60 dark:bg-gray-950/60 border border-white/20 dark:border-white/10 shadow-sm rounded-xl'>
                  <CardContent className='p-5 flex items-start gap-4'>
                    <div className='p-2.5 rounded-lg border bg-background shrink-0'>
                      {getStatusIcon(validationResult.breakdown?.blueprint.status || 'FAIL')}
                    </div>
                    <div className='space-y-1 min-w-0 flex-1'>
                      <div className='flex items-center justify-between gap-2'>
                        <span className='text-sm font-bold text-foreground truncate'>
                          Blueprint Layer
                        </span>
                        <Badge
                          className={getStatusColor(
                            validationResult.breakdown?.blueprint.status || 'FAIL',
                          )}
                        >
                          {validationResult.breakdown?.blueprint.status}
                        </Badge>
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Validates matching blueprint matrix weights and style profile associations.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Explorer Section */}
      {selectedConfigId && validationResult && !isLoading && (
        <Card className='backdrop-blur-md bg-white/60 dark:bg-gray-950/60 border border-white/20 dark:border-white/10 shadow-sm rounded-xl overflow-hidden'>
          <CardHeader className='border-b bg-muted/40 p-5'>
            <CardTitle className='text-lg font-bold text-foreground'>Error Explorer</CardTitle>
          </CardHeader>
          <CardContent className='p-0 divide-y divide-border'>
            {/* Configuration Layer Accordion */}
            <div className='flex flex-col'>
              <button
                onClick={() => toggleLayer('configuration')}
                className='w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors text-left'
              >
                <div className='flex items-center gap-2'>
                  {expandedLayers.configuration ? (
                    <ChevronDown className='w-5 h-5' />
                  ) : (
                    <ChevronRight className='w-5 h-5' />
                  )}
                  <span className='font-semibold text-sm text-foreground'>
                    Configuration Layer Checks
                  </span>
                </div>
                <Badge
                  className={getStatusColor(
                    validationResult.breakdown?.configuration.status || 'FAIL',
                  )}
                >
                  {validationResult.breakdown?.configuration.status}
                </Badge>
              </button>
              {expandedLayers.configuration && (
                <div className='px-10 pb-5 text-sm space-y-2'>
                  {validationResult.breakdown?.configuration.errors.length === 0 ? (
                    <div className='text-emerald-500 flex items-center gap-2'>
                      <CheckCircle className='w-4 h-4' /> All configuration layer parameters
                      verified.
                    </div>
                  ) : (
                    <ul className='space-y-1.5 list-none'>
                      {validationResult.breakdown?.configuration.errors.map((err, idx) => (
                        <li key={idx} className='text-rose-500 flex items-start gap-2'>
                          <XCircle className='w-4 h-4 shrink-0 mt-0.5' />
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Knowledge Layer Accordion */}
            <div className='flex flex-col'>
              <button
                onClick={() => toggleLayer('knowledge')}
                className='w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors text-left'
              >
                <div className='flex items-center gap-2'>
                  {expandedLayers.knowledge ? (
                    <ChevronDown className='w-5 h-5' />
                  ) : (
                    <ChevronRight className='w-5 h-5' />
                  )}
                  <span className='font-semibold text-sm text-foreground'>
                    Knowledge Layer Checks
                  </span>
                </div>
                <Badge
                  className={getStatusColor(validationResult.breakdown?.knowledge.status || 'FAIL')}
                >
                  {validationResult.breakdown?.knowledge.status}
                </Badge>
              </button>
              {expandedLayers.knowledge && (
                <div className='px-10 pb-5 text-sm space-y-2'>
                  {validationResult.breakdown?.knowledge.errors.length === 0 ? (
                    <div className='text-emerald-500 flex items-center gap-2'>
                      <CheckCircle className='w-4 h-4' /> All syllabus and section topic mappings
                      verified.
                    </div>
                  ) : (
                    <ul className='space-y-1.5 list-none'>
                      {validationResult.breakdown?.knowledge.errors.map((err, idx) => (
                        <li key={idx} className='text-rose-500 flex items-start gap-2'>
                          <XCircle className='w-4 h-4 shrink-0 mt-0.5' />
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Template Layer Accordion */}
            <div className='flex flex-col'>
              <button
                onClick={() => toggleLayer('templates')}
                className='w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors text-left'
              >
                <div className='flex items-center gap-2'>
                  {expandedLayers.templates ? (
                    <ChevronDown className='w-5 h-5' />
                  ) : (
                    <ChevronRight className='w-5 h-5' />
                  )}
                  <span className='font-semibold text-sm text-foreground'>
                    Template Layer Checks
                  </span>
                </div>
                <Badge
                  className={getStatusColor(validationResult.breakdown?.templates.status || 'FAIL')}
                >
                  {validationResult.breakdown?.templates.status}
                </Badge>
              </button>
              {expandedLayers.templates && (
                <div className='px-10 pb-5 text-sm space-y-2'>
                  {validationResult.breakdown?.templates.errors.length === 0 ? (
                    <div className='text-emerald-500 flex items-center gap-2'>
                      <CheckCircle className='w-4 h-4' /> All templates, variables, rules, and
                      solutions verified.
                    </div>
                  ) : (
                    <ul className='space-y-1.5 list-none'>
                      {validationResult.breakdown?.templates.errors.map((err, idx) => (
                        <li key={idx} className='text-rose-500 flex items-start gap-2'>
                          <XCircle className='w-4 h-4 shrink-0 mt-0.5' />
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Blueprint Layer Accordion */}
            <div className='flex flex-col'>
              <button
                onClick={() => toggleLayer('blueprint')}
                className='w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors text-left'
              >
                <div className='flex items-center gap-2'>
                  {expandedLayers.blueprint ? (
                    <ChevronDown className='w-5 h-5' />
                  ) : (
                    <ChevronRight className='w-5 h-5' />
                  )}
                  <span className='font-semibold text-sm text-foreground'>
                    Blueprint Layer Checks
                  </span>
                </div>
                <Badge
                  className={getStatusColor(validationResult.breakdown?.blueprint.status || 'FAIL')}
                >
                  {validationResult.breakdown?.blueprint.status}
                </Badge>
              </button>
              {expandedLayers.blueprint && (
                <div className='px-10 pb-5 text-sm space-y-2'>
                  {validationResult.breakdown?.blueprint.errors.length === 0 ? (
                    <div className='text-emerald-500 flex items-center gap-2'>
                      <CheckCircle className='w-4 h-4' /> All blueprints, style profiles, and
                      allocations verified.
                    </div>
                  ) : (
                    <ul className='space-y-1.5 list-none'>
                      {validationResult.breakdown?.blueprint.errors.map((err, idx) => (
                        <li key={idx} className='text-rose-500 flex items-start gap-2'>
                          <XCircle className='w-4 h-4 shrink-0 mt-0.5' />
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
