'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useCompilationPreview,
  useCompilationHealth,
  useCompileBlueprint,
  useBlueprint,
} from '@/services/blueprints/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Play,
  Layers,
  Workflow,
  FileJson,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BlueprintCompilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [compiledBatch, setCompiledBatch] = useState<{
    batchId: string;
    requestCount: number;
  } | null>(null);

  const { data: blueprint, isLoading: bpLoading } = useBlueprint(id);
  const {
    data: preview,
    isLoading: previewLoading,
    refetch: refetchPreview,
  } = useCompilationPreview(id);
  const {
    data: health,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = useCompilationHealth(id);

  const compileMutation = useCompileBlueprint();

  const handleCompile = async () => {
    if (!health?.valid) {
      toast.error('Cannot compile: Blueprint configuration has validation errors.');
      return;
    }

    try {
      const response = await compileMutation.mutateAsync(id);
      setCompiledBatch(response);
      toast.success(`Blueprint compiled successfully! Batch ID: ${response.batchId}`);
      refetchHealth();
    } catch (err: any) {
      toast.error(err.message || 'Compilation failed.');
    }
  };

  const handleRefreshAll = () => {
    refetchPreview();
    refetchHealth();
  };

  const isLoading = bpLoading || previewLoading || healthLoading;

  if (isLoading) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-6xl space-y-8 animate-pulse'>
        <Skeleton className='h-8 w-1/4' />
        <Skeleton className='h-32 w-full mt-6' />
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-6'>
          <Skeleton className='h-64 md:col-span-2' />
          <Skeleton className='h-64' />
        </div>
      </div>
    );
  }

  const isReady = health?.checks?.generationReady?.status === 'PASS';
  const compileDisabled = !health?.valid || compileMutation.isPending;

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-6xl space-y-8'>
      {/* Breadcrumbs & Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <Link
            href={`/admin/blueprints/${id}`}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all hover:scale-105 active:scale-95'
          >
            <ArrowLeft className='w-5 h-5 text-muted-foreground' />
          </Link>
          <div>
            <h1 className='text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400'>
              Blueprint Compilation Engine
            </h1>
            <p className='text-muted-foreground mt-1'>
              Deterministic compiler pipeline for {blueprint?.name || 'Blueprint'}.
            </p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            onClick={handleRefreshAll}
            disabled={compileMutation.isPending}
            className='transition-all duration-200 active:scale-95'
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Re-Evaluate Health
          </Button>
        </div>
      </div>

      {/* Generation Gate Warnings */}
      {!isReady && (
        <Card className='border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 shadow-sm animate-fade-in'>
          <CardContent className='pt-6 flex items-start gap-4'>
            <AlertTriangle className='w-6 h-6 text-red-500 shrink-0 mt-0.5' />
            <div className='space-y-1.5'>
              <h3 className='font-semibold text-red-800 dark:text-red-400'>
                Generation Disabled: Exam Configuration Not Ready
              </h3>
              <p className='text-sm text-red-700 dark:text-red-300'>
                The Readiness Engine marks this configuration as <strong>NOT READY</strong>. You
                must resolve all checks in the readiness tab of the Exam Configuration before this
                blueprint can be compiled.
              </p>
              <Link
                href={`/admin/configs/${blueprint?.configId}`}
                className='inline-block text-red-600 dark:text-red-400 hover:underline text-sm font-semibold mt-2'
              >
                Go to Exam Configuration Readiness Tab &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Layout Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Left Side: Breakdowns & Visualizations */}
        <div className='lg:col-span-2 space-y-8'>
          {/* Deliverable 13: Allocation Breakdown */}
          <Card className='shadow-sm border border-gray-200 dark:border-gray-800'>
            <CardHeader className='border-b bg-gray-50/40 dark:bg-gray-900/10'>
              <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                <Layers className='w-5 h-5 text-indigo-500' />
                Allocation & Difficulty Breakdown
              </CardTitle>
              <CardDescription>
                Overview of questions allocated to sections, topics, and difficulties.
              </CardDescription>
            </CardHeader>
            <CardContent className='p-0'>
              {preview?.sections && preview.sections.length > 0 ? (
                <div className='divide-y divide-gray-150 dark:divide-gray-850'>
                  {preview.sections.map((section: any) => (
                    <div key={section.sectionId} className='p-6 space-y-4'>
                      <div className='flex justify-between items-center'>
                        <Badge
                          variant='outline'
                          className='text-sm font-medium border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 text-indigo-600 dark:text-indigo-400 px-3 py-0.5 rounded-full'
                        >
                          Section: {section.sectionId}
                        </Badge>
                        <span className='text-sm font-semibold text-muted-foreground'>
                          {section.questionCount} Questions Total
                        </span>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {section.allocations.map((alloc: any) => (
                          <div
                            key={alloc.topicId}
                            className='p-4 border rounded-xl bg-gray-50/50 dark:bg-gray-900/20 hover:shadow-md transition-all duration-300'
                          >
                            <div className='flex justify-between items-start mb-3'>
                              <div>
                                <h4 className='font-semibold text-foreground text-sm'>
                                  {alloc.topicName}
                                </h4>
                                <p className='text-xs text-muted-foreground'>ID: {alloc.topicId}</p>
                              </div>
                              <Badge className='bg-indigo-600 text-white rounded-md font-bold px-2 py-0.5 text-xs'>
                                {alloc.total} Qs
                              </Badge>
                            </div>

                            <div className='space-y-1.5 mt-2'>
                              <div className='flex justify-between text-xs font-medium'>
                                <span className='text-green-600 dark:text-green-400'>Easy</span>
                                <span className='text-amber-600 dark:text-amber-400'>Medium</span>
                                <span className='text-red-600 dark:text-red-400'>Hard</span>
                              </div>
                              <div className='h-2.5 w-full flex rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800'>
                                <div
                                  style={{
                                    width: `${alloc.total > 0 ? (alloc.byDifficulty.EASY / alloc.total) * 100 : 0}%`,
                                  }}
                                  className='bg-green-500'
                                />
                                <div
                                  style={{
                                    width: `${alloc.total > 0 ? (alloc.byDifficulty.MEDIUM / alloc.total) * 100 : 0}%`,
                                  }}
                                  className='bg-amber-500'
                                />
                                <div
                                  style={{
                                    width: `${alloc.total > 0 ? (alloc.byDifficulty.HARD / alloc.total) * 100 : 0}%`,
                                  }}
                                  className='bg-red-500'
                                />
                              </div>
                              <div className='flex justify-between text-[11px] text-muted-foreground font-semibold px-0.5 mt-1'>
                                <span>{alloc.byDifficulty.EASY} Qs</span>
                                <span>{alloc.byDifficulty.MEDIUM} Qs</span>
                                <span>{alloc.byDifficulty.HARD} Qs</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='p-6 text-center text-muted-foreground'>
                  No sections allocation metadata available.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deliverable 12: Compilation Dashboard Visualizer */}
          <Card className='shadow-sm border border-gray-200 dark:border-gray-800'>
            <CardHeader className='border-b bg-gray-50/40 dark:bg-gray-900/10'>
              <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                <Workflow className='w-5 h-5 text-indigo-500' />
                Compilation Flow Visualizer
              </CardTitle>
              <CardDescription>
                Visual pipeline showing compiled blueprint mappings down to the generation batch.
              </CardDescription>
            </CardHeader>
            <CardContent className='p-6 space-y-8'>
              <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
                {/* Step 1: Blueprint */}
                <div className='flex-1 w-full p-4 border rounded-xl bg-white dark:bg-gray-950 text-center shadow-sm relative group hover:border-indigo-500 transition-all duration-300'>
                  <div className='w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 font-bold text-sm'>
                    1
                  </div>
                  <h4 className='font-semibold text-sm'>Blueprint</h4>
                  <p className='text-xs text-muted-foreground mt-1'>{blueprint?.name}</p>
                  <Badge
                    variant='outline'
                    className='mt-3 text-[10px] uppercase font-bold text-indigo-500 border-indigo-200'
                  >
                    Config ID: {blueprint?.configId.substring(0, 8)}...
                  </Badge>
                </div>

                <ChevronRight className='w-6 h-6 text-muted-foreground shrink-0 rotate-90 md:rotate-0' />

                {/* Step 2: Requests */}
                <div className='flex-1 w-full p-4 border rounded-xl bg-white dark:bg-gray-950 text-center shadow-sm relative group hover:border-purple-500 transition-all duration-300'>
                  <div className='w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3 font-bold text-sm'>
                    2
                  </div>
                  <h4 className='font-semibold text-sm'>Question Requests</h4>
                  <p className='text-xs text-muted-foreground mt-1'>
                    {preview?.requests?.length || 0} Request Nodes Mapped
                  </p>
                  <Badge
                    variant='outline'
                    className='mt-3 text-[10px] uppercase font-bold text-purple-500 border-purple-200'
                  >
                    Total Qs:{' '}
                    {preview?.requests?.reduce((sum: number, r: any) => sum + r.quantity, 0) || 0}
                  </Badge>
                </div>

                <ChevronRight className='w-6 h-6 text-muted-foreground shrink-0 rotate-90 md:rotate-0' />

                {/* Step 3: Batch */}
                <div className='flex-1 w-full p-4 border rounded-xl bg-white dark:bg-gray-950 text-center shadow-sm relative group hover:border-emerald-500 transition-all duration-300'>
                  <div className='w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 font-bold text-sm'>
                    3
                  </div>
                  <h4 className='font-semibold text-sm'>Generation Batch</h4>
                  <p className='text-xs text-muted-foreground mt-1'>
                    {compiledBatch ? 'Compiled & Locked' : 'Pending Compile'}
                  </p>
                  <Badge
                    variant='outline'
                    className={`mt-3 text-[10px] uppercase font-bold ${compiledBatch ? 'text-emerald-500 border-emerald-200' : 'text-amber-500 border-amber-200'}`}
                  >
                    {compiledBatch
                      ? `Batch ID: ${compiledBatch.batchId.substring(0, 8)}...`
                      : 'Not Compiled'}
                  </Badge>
                </div>
              </div>

              {compiledBatch && (
                <div className='p-4 border rounded-xl bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/50 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'>
                      <FileJson className='w-5 h-5' />
                    </div>
                    <div>
                      <h4 className='font-semibold text-sm text-emerald-800 dark:text-emerald-400'>
                        Generation Batch Payload Generated
                      </h4>
                      <p className='text-xs text-emerald-600 dark:text-emerald-300 font-mono select-all mt-0.5'>
                        Batch ID: {compiledBatch.batchId}
                      </p>
                    </div>
                  </div>
                  <Badge className='bg-emerald-600 text-white rounded-md font-bold px-3 py-1 text-xs'>
                    {compiledBatch.requestCount} Requests
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Health Checks & Gate Trigger */}
        <div className='space-y-8'>
          {/* Deliverable 14: Health Widget */}
          <Card className='shadow-sm border border-gray-200 dark:border-gray-800'>
            <CardHeader className='border-b bg-gray-50/40 dark:bg-gray-900/10'>
              <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                <Activity className='w-5 h-5 text-indigo-500' />
                Compilation Health Audit
              </CardTitle>
              <CardDescription>Audits blueprint parameters and DB configurations.</CardDescription>
            </CardHeader>
            <CardContent className='p-6 space-y-6'>
              {health ? (
                <ul className='space-y-4'>
                  {/* Check 1: Templates Available */}
                  <li className='flex items-start gap-3'>
                    {health.checks.templatesAvailable.status === 'PASS' ? (
                      <CheckCircle2 className='w-5 h-5 text-green-500 shrink-0 mt-0.5' />
                    ) : (
                      <XCircle className='w-5 h-5 text-red-500 shrink-0 mt-0.5' />
                    )}
                    <div>
                      <p className='text-sm font-semibold text-foreground'>Templates Available</p>
                      <p className='text-xs text-muted-foreground mt-0.5'>
                        {health.checks.templatesAvailable.message ||
                          'Verifying templates availability...'}
                      </p>
                    </div>
                  </li>

                  {/* Check 2: Concepts Available */}
                  <li className='flex items-start gap-3'>
                    {health.checks.conceptsAvailable.status === 'PASS' ? (
                      <CheckCircle2 className='w-5 h-5 text-green-500 shrink-0 mt-0.5' />
                    ) : (
                      <XCircle className='w-5 h-5 text-red-500 shrink-0 mt-0.5' />
                    )}
                    <div>
                      <p className='text-sm font-semibold text-foreground'>Concepts Available</p>
                      <p className='text-xs text-muted-foreground mt-0.5'>
                        {health.checks.conceptsAvailable.message || 'Verifying concept mappings...'}
                      </p>
                    </div>
                  </li>

                  {/* Check 3: Difficulty Coverage */}
                  <li className='flex items-start gap-3'>
                    {health.checks.difficultyCoverage.status === 'PASS' ? (
                      <CheckCircle2 className='w-5 h-5 text-green-500 shrink-0 mt-0.5' />
                    ) : (
                      <XCircle className='w-5 h-5 text-red-500 shrink-0 mt-0.5' />
                    )}
                    <div>
                      <p className='text-sm font-semibold text-foreground'>
                        Blueprint & Difficulty Specs
                      </p>
                      <p className='text-xs text-muted-foreground mt-0.5'>
                        {health.checks.difficultyCoverage.message ||
                          'Verifying difficulty ratio coverages...'}
                      </p>
                    </div>
                  </li>

                  {/* Check 4: Generation Ready */}
                  <li className='flex items-start gap-3'>
                    {health.checks.generationReady.status === 'PASS' ? (
                      <CheckCircle2 className='w-5 h-5 text-green-500 shrink-0 mt-0.5' />
                    ) : (
                      <XCircle className='w-5 h-5 text-red-500 shrink-0 mt-0.5' />
                    )}
                    <div>
                      <p className='text-sm font-semibold text-foreground'>
                        Exam Configuration Ready
                      </p>
                      <p className='text-xs text-muted-foreground mt-0.5'>
                        {health.checks.generationReady.message ||
                          'Auditing configuration readiness...'}
                      </p>
                    </div>
                  </li>
                </ul>
              ) : (
                <div className='text-sm text-muted-foreground'>No health checks run.</div>
              )}

              {/* Error messages block */}
              {health?.errors && health.errors.length > 0 && (
                <div className='p-4 rounded-xl border border-red-200 bg-red-50/30 text-red-800 dark:border-red-900/50 dark:bg-red-950/10 dark:text-red-400 space-y-2'>
                  <h4 className='text-xs font-bold uppercase tracking-wider flex items-center gap-1.5'>
                    <AlertTriangle className='w-4 h-4' />
                    Verification Logs ({health.errors.length})
                  </h4>
                  <ul className='text-xs space-y-1 divide-y divide-red-200/30 dark:divide-red-900/30'>
                    {health.errors.map((err: string, i: number) => (
                      <li key={i} className='pt-1 first:pt-0'>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deliverable 15: Generation Gate Compile Button Card */}
          <Card className='shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden relative'>
            <div className='absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500' />
            <CardHeader className='pt-6'>
              <CardTitle className='text-base font-semibold'>Compile Trigger</CardTitle>
              <CardDescription>Builds and locks the Generation Batch payload.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Button
                onClick={handleCompile}
                disabled={compileDisabled}
                className='w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-98 disabled:opacity-50 disabled:pointer-events-none'
              >
                {compileMutation.isPending ? (
                  <>
                    <RefreshCw className='w-5 h-5 mr-2 animate-spin' />
                    Compiling Blueprint...
                  </>
                ) : (
                  <>
                    <Play className='w-5 h-5 mr-2 fill-current' />
                    Execute Blueprint Compilation
                  </>
                )}
              </Button>

              <div className='flex items-center justify-between text-xs font-semibold text-muted-foreground bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg border'>
                <span>Prerequisites Status:</span>
                <span
                  className={health?.valid ? 'text-green-600 dark:text-green-400' : 'text-red-500'}
                >
                  {health?.valid ? 'VALID & READY' : 'INVALID'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
