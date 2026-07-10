'use client';

import React from 'react';
import { useConfigurationValidation } from '../hooks/useConfigurationValidation';
import { useConfigWizardStore } from './wizard-store';
import { ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface GenerationReadinessPanelProps {
  configId: string;
  onTabChange?: (tabId: string) => void;
}

export function GenerationReadinessPanel({ configId, onTabChange }: GenerationReadinessPanelProps) {
  const { data: validation, isLoading, isError, refetch } = useConfigurationValidation(configId);
  const selectedBlueprintId = useConfigWizardStore((state) => state.getBlueprintId(configId));

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
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const { valid, readiness, errors, warnings } = validation;

  return (
    <div className='max-w-4xl mx-auto space-y-8 py-4'>
      <div className='space-y-1'>
        <h3 className='text-2xl font-semibold tracking-tight'>Generation Readiness</h3>
        <p className='text-muted-foreground'>
          This checks if your configuration is fully ready for deterministic question generation.
        </p>
      </div>

      <div className='border rounded-xl bg-card shadow-sm overflow-hidden'>
        <div className='bg-muted/30 p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div>
            <h4 className='font-semibold text-lg text-foreground'>Readiness Score</h4>
            <p className="text-sm text-muted-foreground mt-1">Based on topics, concepts, templates, and weightages.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-background px-4 py-3 rounded-lg border shadow-sm">
            <div className="text-4xl font-black tabular-nums tracking-tighter" style={{ color: valid ? '#16a34a' : (readiness > 50 ? '#d97706' : '#dc2626') }}>
              {readiness}%
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                valid
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
              }`}
            >
              {valid ? (
                <>
                  <ShieldCheck className='w-5 h-5' /> Ready: YES
                </>
              ) : (
                <>
                  <ShieldAlert className='w-5 h-5' /> Ready: NO
                </>
              )}
            </span>
          </div>
        </div>

        <div className='p-6 space-y-8'>
          {/* Checklist Section */}
          {validation.checklist && (
            <div className="space-y-4">
              <h5 className="font-semibold text-foreground flex items-center gap-2 text-lg">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Readiness Checklist
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'General Information', valid: validation.checklist.generalInformation, action: 'Update Info', actionTab: 'general' },
                  { label: 'Sections Created', valid: validation.checklist.sectionsCreated, action: 'Create Section', actionTab: 'sections' },
                  { label: 'Topics Assigned', valid: validation.checklist.topicsAssigned, action: 'Assign Topic', actionTab: 'topics' },
                  { label: 'Concepts Available', valid: validation.checklist.conceptsAvailable, action: 'Add Concept', actionTab: 'concepts-templates' },
                  { label: 'Templates Created', valid: validation.checklist.templatesCreated, action: 'Create Template', actionTab: 'concepts-templates' },
                  { label: 'Difficulty Configured', valid: validation.checklist.difficultyConfigured, action: 'Configure', actionTab: 'difficulty' },
                  { label: 'Rules Configured', valid: validation.checklist.rulesConfigured, action: 'Configure', actionTab: 'rules' },
                  { label: 'Roles Configured', valid: validation.checklist.rolesConfigured, action: 'Configure', actionTab: 'roles' },
                  { label: 'Blueprint Complete', valid: !!selectedBlueprintId || validation.checklist.blueprintComplete, action: 'Select Blueprint', actionTab: 'blueprint' },
                  { label: 'Total Questions Match', valid: validation.checklist.totalQuestionsMatch, action: 'Fix Counts', actionTab: 'sections' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center justify-between p-4 rounded-lg border shadow-sm transition-colors ${item.valid ? 'bg-green-50/30 border-green-200' : 'bg-red-50/30 border-red-200 hover:bg-red-50/50'}`}>
                    <div className="flex items-center gap-3">
                      {item.valid ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                      )}
                      <span className={`text-sm font-medium ${item.valid ? 'text-green-800' : 'text-red-700'}`}>
                        {item.label}
                      </span>
                    </div>
                    {!item.valid && item.action && (
                      <Button variant="outline" size="sm" onClick={() => onTabChange?.(item.actionTab!)} className="h-8 text-xs font-medium">
                        {item.action}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors & Warnings Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Errors Section */}
            <div className='space-y-4'>
              <h5 className={`font-semibold flex items-center gap-2 text-lg ${errors.length > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {errors.length > 0 ? (
                  <><XCircle className="w-5 h-5" /> Blocking Issues ({errors.length})</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> Blocking Issues (0)</>
                )}
              </h5>
              {errors.length > 0 ? (
                <ul className="space-y-3">
                  {errors.map((err, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-red-700 bg-red-50/80 border border-red-100 p-4 rounded-lg shadow-sm">
                      <span className="mt-0.5 font-bold">•</span>
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center gap-3 text-green-700 bg-green-50/80 border border-green-100 p-4 rounded-lg shadow-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />
                  <span className="font-medium text-sm">No blocking issues found.</span>
                </div>
              )}
            </div>

            {/* Warnings Section */}
            {warnings.length > 0 && (
              <div className="space-y-4">
                <h5 className="font-semibold text-amber-700 flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5" />
                  Warnings ({warnings.length})
                </h5>
                <ul className="space-y-3">
                  {warnings.map((warn, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-amber-700 bg-amber-50/80 border border-amber-100 p-4 rounded-lg shadow-sm">
                      <span className="mt-0.5 font-bold">•</span>
                      <span>{warn}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {!valid && (
          <div className="bg-muted/30 p-4 border-t flex items-center justify-between">
            <span className='text-sm text-muted-foreground'>Resolve blocking issues before continuing.</span>
            <Button onClick={() => onTabChange?.('topics')} size="lg" className='shadow-sm'>
              Review Topics & Concepts
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
