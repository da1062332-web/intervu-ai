'use client';

import React from 'react';
import { useReadiness, useGenerateReadiness } from '../hooks/use-readiness';
import { useReadinessStore, ReadinessFix } from '@/store/readiness.store';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

interface ReadinessTabProps {
  configId: string;
  onTabChange: (tabId: string) => void;
}

export function ReadinessTab({ configId, onTabChange }: ReadinessTabProps) {
  // Trigger initial query load
  const { isLoading: queryLoading } = useReadiness(configId);
  const generateMutation = useGenerateReadiness(configId);

  // Retrieve values from Zustand store
  const score = useReadinessStore((s) => s.score);
  const status = useReadinessStore((s) => s.status);
  const checks = useReadinessStore((s) => s.checks);
  const report = useReadinessStore((s) => s.report);
  const isGenerating = useReadinessStore((s) => s.isGenerating);

  const layerBreakdown = report?.layerBreakdown || {
    configuration: 'FAIL',
    knowledge: 'FAIL',
    templates: 'FAIL',
    blueprint: 'FAIL',
  };

  const fixes = report?.fixes || [];

  const handleRecalculate = () => {
    generateMutation.mutate();
  };

  if (queryLoading) {
    return (
      <div className='flex flex-col items-center justify-center py-12 space-y-4'>
        <RefreshCw className='w-8 h-8 text-indigo-600 animate-spin' />
        <p className='text-sm text-muted-foreground'>Running readiness validation audit...</p>
      </div>
    );
  }

  // Circular progress math
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine colors based on score
  let scoreColorClass = 'text-red-500';
  let strokeColor = '#ef4444'; // red
  if (score === 100) {
    scoreColorClass = 'text-green-500';
    strokeColor = '#22c55e'; // green
  } else if (score >= 50) {
    scoreColorClass = 'text-amber-500';
    strokeColor = '#f59e0b'; // amber
  }

  const getBadgeStyle = (state: string) => {
    switch (state) {
      case 'PASS':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'WARNING':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }
  };

  const renderStatusIcon = (state: string) => {
    switch (state) {
      case 'PASS':
        return <CheckCircle2 className='w-5 h-5 text-green-500' />;
      case 'WARNING':
        return <AlertTriangle className='w-5 h-5 text-amber-500' />;
      default:
        return <XCircle className='w-5 h-5 text-red-500' />;
    }
  };

  return (
    <div className='space-y-8'>
      {/* Top Header Card */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 border rounded-xl bg-gradient-to-r from-gray-50/50 via-background to-gray-50/50 dark:from-gray-900/30 dark:to-gray-900/30 shadow-sm'>
        <div className='flex items-center gap-6'>
          {/* Radial Progress Wheel */}
          <div className='relative w-36 h-36 flex items-center justify-center'>
            <svg className='w-full h-full transform -rotate-90' viewBox='0 0 140 140'>
              <circle
                className='text-gray-200 dark:text-gray-800'
                strokeWidth={strokeWidth}
                stroke='currentColor'
                fill='transparent'
                r={radius}
                cx='70'
                cy='70'
              />
              <circle
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap='round'
                stroke={strokeColor}
                fill='transparent'
                r={radius}
                cx='70'
                cy='70'
                className='transition-all duration-500 ease-out'
              />
            </svg>
            <div className='absolute flex flex-col items-center justify-center text-center'>
              <span className={`text-3xl font-extrabold tracking-tight ${scoreColorClass}`}>
                {score}
              </span>
              <span className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider'>
                Readiness
              </span>
            </div>
          </div>

          <div>
            <h2 className='text-xl font-bold flex items-center gap-2'>
              Exam Generation Status:{' '}
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                  status === 'READY'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : status === 'PARTIALLY_READY'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {status.replace('_', ' ')}
              </span>
            </h2>
            <p className='text-sm text-muted-foreground mt-2 max-w-lg'>
              {status === 'READY'
                ? 'All systems verified! The exam generation pipeline is fully cleared to build test instances.'
                : 'Some validation steps have warnings or errors. Address the actionable fixes listed below to enable generation.'}
            </p>
          </div>
        </div>

        <Button
          onClick={handleRecalculate}
          disabled={isGenerating}
          variant='outline'
          className='self-start md:self-center flex items-center gap-2 font-medium hover:bg-muted'
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Analyzing...' : 'Recalculate Readiness'}
        </Button>
      </div>

      {/* Layer Status Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {[
          {
            key: 'configuration' as const,
            label: 'Configuration',
            desc: 'Sections & basic config structure',
          },
          {
            key: 'knowledge' as const,
            label: 'Knowledge Layer',
            desc: 'Topic mappings and weightages',
          },
          {
            key: 'templates' as const,
            label: 'Template Library',
            desc: 'Concept templates & validation',
          },
          {
            key: 'blueprint' as const,
            label: 'Blueprint Layout',
            desc: 'Difficulty allocations & rules',
          },
        ].map((layer) => {
          const state = layerBreakdown[layer.key] || 'FAIL';
          return (
            <div
              key={layer.key}
              className='p-5 border rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-36'
            >
              <div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-semibold tracking-wide text-muted-foreground uppercase'>
                    {layer.label}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getBadgeStyle(state)}`}
                  >
                    {state}
                  </span>
                </div>
                <p className='text-xs text-muted-foreground mt-2'>{layer.desc}</p>
              </div>
              <div className='flex items-center justify-between text-xs mt-4'>
                <span className='font-medium text-foreground'>Status</span>
                <span className='flex items-center gap-1.5'>
                  {renderStatusIcon(state)}
                  {state === 'PASS' ? 'Cleared' : 'Needs attention'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Panels Grid (Checks list + Fixes list) */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left column: Full Checks List */}
        <div className='lg:col-span-2 border rounded-xl p-6 bg-background shadow-sm space-y-6'>
          <div>
            <h3 className='text-lg font-bold tracking-tight'>Scoring Audit Checks</h3>
            <p className='text-xs text-muted-foreground'>
              A complete list of the 10 checks required to hit 100 points.
            </p>
          </div>

          <div className='divide-y border rounded-lg overflow-hidden'>
            {checks.map((check, idx) => (
              <div
                key={idx}
                className='flex items-start justify-between p-4 hover:bg-muted/30 transition-colors'
              >
                <div className='space-y-1 pr-4'>
                  <p className='text-sm font-semibold text-foreground'>{check.name}</p>
                  {check.message && (
                    <p className='text-xs text-muted-foreground leading-relaxed'>{check.message}</p>
                  )}
                </div>
                <span
                  className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    check.status === 'PASS'
                      ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                      : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                  }`}
                >
                  {check.status === 'PASS' ? (
                    <ShieldCheck className='w-3.5 h-3.5' />
                  ) : (
                    <ShieldAlert className='w-3.5 h-3.5' />
                  )}
                  {check.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Actionable Fixes */}
        <div className='border rounded-xl p-6 bg-background shadow-sm space-y-6 flex flex-col justify-between'>
          <div className='space-y-6'>
            <div>
              <h3 className='text-lg font-bold tracking-tight'>Actionable Fixes</h3>
              <p className='text-xs text-muted-foreground'>
                Step-by-step solutions to resolve the failing checks.
              </p>
            </div>

            {fixes.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-center space-y-3'>
                <CheckCircle2 className='w-12 h-12 text-green-500' />
                <p className='text-sm font-semibold'>Configuration Complete!</p>
                <p className='text-xs text-muted-foreground'>No outstanding fixes are required.</p>
              </div>
            ) : (
              <div className='space-y-3'>
                {fixes.map((fix: ReadinessFix, idx: number) => {
                  if (fix.tab) {
                    return (
                      <button
                        key={idx}
                        onClick={() => fix.tab && onTabChange(fix.tab)}
                        className='w-full text-left p-3.5 border rounded-lg hover:border-indigo-400 hover:bg-indigo-50/10 dark:hover:border-indigo-900/50 transition-all flex items-start gap-3 group'
                      >
                        <XCircle className='w-4 h-4 text-red-500 shrink-0 mt-0.5' />
                        <div className='space-y-1.5'>
                          <p className='text-xs font-semibold text-foreground leading-normal'>
                            {fix.message}
                          </p>
                          <span className='inline-flex items-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline'>
                            Fix in Tab{' '}
                            <ArrowRight className='w-3 h-3 ml-1 transition-transform group-hover:translate-x-0.5' />
                          </span>
                        </div>
                      </button>
                    );
                  }

                  if (fix.link) {
                    return (
                      <Link key={idx} href={fix.link} className='block'>
                        <div className='p-3.5 border rounded-lg hover:border-indigo-400 hover:bg-indigo-50/10 dark:hover:border-indigo-900/50 transition-all flex items-start gap-3 group'>
                          <XCircle className='w-4 h-4 text-red-500 shrink-0 mt-0.5' />
                          <div className='space-y-1.5'>
                            <p className='text-xs font-semibold text-foreground leading-normal'>
                              {fix.message}
                            </p>
                            <span className='inline-flex items-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline'>
                              Go to Settings{' '}
                              <ArrowRight className='w-3 h-3 ml-1 transition-transform group-hover:translate-x-0.5' />
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className='p-3.5 border rounded-lg flex items-start gap-3 bg-red-50/30 dark:bg-red-950/5'
                    >
                      <XCircle className='w-4 h-4 text-red-500 shrink-0 mt-0.5' />
                      <p className='text-xs font-semibold text-foreground leading-normal'>
                        {fix.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {status === 'READY' && (
            <div className='mt-6 pt-4 border-t'>
              <Link href={`/admin/blueprints`} className='w-full block'>
                <Button className='w-full bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center justify-center gap-2'>
                  Proceed to Generation
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
