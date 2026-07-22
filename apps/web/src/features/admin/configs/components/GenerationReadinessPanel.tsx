'use client';

import React from 'react';
import { useConfigurationValidation } from '../hooks/useConfigurationValidation';
import { ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface GenerationReadinessPanelProps {
  configId: string;
  onTabChange?: (tabId: string) => void;
}

export function GenerationReadinessPanel({ configId, onTabChange }: GenerationReadinessPanelProps) {
  const { data: validation, isLoading, isError, refresh, isRefreshing } = useConfigurationValidation(configId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">Running configuration checks...</p>
      </div>
    );
  }

  if (isError || !validation) {
    return (
      <div className="text-center py-12 border rounded-lg bg-red-50/50">
        <h3 className="text-lg font-medium text-red-600 mb-2">Validation Error</h3>
        <p className="text-muted-foreground mb-4">Failed to run readiness checks for this configuration.</p>
        <Button variant="outline" onClick={() => refresh()} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Retry
        </Button>
      </div>
    );
  }

  const { score, status, checks, report } = validation;
  const isReady = status === 'READY';
  const hasFixes = report?.fixes && report.fixes.length > 0;

  return (
    <div className='max-w-4xl mx-auto space-y-8 py-4'>
      <div className='flex items-center justify-between'>
        <div className='space-y-1'>
          <h3 className='text-2xl font-semibold tracking-tight'>Generation Readiness</h3>
          <p className='text-muted-foreground'>
            This checks if your configuration is fully ready for deterministic question generation.
          </p>
        </div>
        <Button variant="outline" onClick={() => refresh()} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className='border rounded-xl bg-card shadow-sm overflow-hidden'>
        <div className='bg-muted/30 p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div>
            <h4 className='font-semibold text-lg text-foreground'>Readiness Score</h4>
            <p className="text-sm text-muted-foreground mt-1">Based on topics, concepts, templates, and weightages.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-background px-4 py-3 rounded-lg border shadow-sm">
            <div className="text-4xl font-black tabular-nums tracking-tighter" style={{ color: isReady ? '#16a34a' : (score > 50 ? '#d97706' : '#dc2626') }}>
              {score}%
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                isReady
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
              }`}
            >
              {isReady ? (
                <>
                  <ShieldCheck className='w-5 h-5' /> {status.replace('_', ' ')}
                </>
              ) : (
                <>
                  <ShieldAlert className='w-5 h-5' /> {status.replace('_', ' ')}
                </>
              )}
            </span>
          </div>
        </div>

        <div className='p-6 space-y-8'>
          {/* Checklist Section */}
          {checks && checks.length > 0 && (
            <div className="space-y-4">
              <h5 className="font-semibold text-foreground flex items-center gap-2 text-lg">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Readiness Checklist
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {checks.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-start justify-between p-4 rounded-lg border shadow-sm transition-colors ${
                      item.status === 'PASS'
                        ? 'bg-green-50/30 border-green-200'
                        : item.status === 'WARN'
                        ? 'bg-amber-50/50 border-amber-300'
                        : 'bg-red-50/30 border-red-200'
                    }`}
                  >
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-center gap-3">
                        {item.status === 'PASS' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                        ) : item.status === 'WARN' ? (
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                        )}
                        <span
                          className={`text-sm font-semibold ${
                            item.status === 'PASS'
                              ? 'text-green-800'
                              : item.status === 'WARN'
                              ? 'text-amber-900'
                              : 'text-red-700'
                          }`}
                        >
                          {item.name}
                        </span>
                      </div>

                      {item.message && item.status !== 'PASS' && (
                        <p className="text-xs font-medium text-amber-900 dark:text-amber-300 ml-8 leading-relaxed">
                          {item.message}
                        </p>
                      )}

                      {item.details && (item.details as any).shortcutUrl && (
                        <div className="ml-8 mt-1">
                          <Button
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm gap-1.5"
                            asChild
                          >
                            <Link href={(item.details as any).shortcutUrl}>
                              ⚡ Generate Questions for Topic
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Fixes */}
          <div className='space-y-4'>
            <h5 className={`font-semibold flex items-center gap-2 text-lg ${hasFixes ? 'text-red-700' : 'text-green-700'}`}>
              {hasFixes ? (
                <><XCircle className="w-5 h-5" /> Actionable Fixes ({report.fixes?.length})</>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /> Actionable Fixes (0)</>
              )}
            </h5>
            
            {hasFixes ? (
              <ul className="space-y-3">
                {report.fixes?.map((fix, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 text-sm text-red-700 bg-red-50/80 border border-red-100 p-4 rounded-lg shadow-sm">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{fix.type.replace(/_/g, ' ').toUpperCase()}</p>
                        <p>{fix.message}</p>
                      </div>
                    </div>
                    {fix.link && (
                      <Button variant="outline" size="sm" asChild className="shrink-0 bg-white hover:bg-red-50">
                        <Link href={fix.link}>
                          Fix <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-3 text-green-700 bg-green-50/80 border border-green-100 p-4 rounded-lg shadow-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />
                <span className="font-medium text-sm">No actionable fixes found. Everything looks great!</span>
              </div>
            )}
          </div>
        </div>
        
        {!isReady && (
          <div className="bg-muted/30 p-4 border-t flex items-center justify-between">
            <span className='text-sm text-muted-foreground'>Resolve the actionable fixes above before continuing.</span>
            <Button onClick={() => onTabChange?.('topics')} size="lg" className='shadow-sm'>
              Review Topics & Concepts
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
