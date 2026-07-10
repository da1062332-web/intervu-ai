'use client';

import React, { useState } from 'react';
import { TemplateSection } from './TemplateSection';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useStrategyConfigStore } from '@/store/strategy-config.store';
import { usePreviewQuestion } from '@/services/question-generation/hooks';
import type { QuestionPreviewResult, GenerationStrategy, ValidationReport } from '@/services/question-generation/types';

const STRATEGY_BADGE_COLORS: Record<GenerationStrategy, string> = {
  VARIABLE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  DATASET: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  HYBRID: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

// ─── Unified Preview Result Panel ─────────────────────────────────────────────

function UnifiedPreviewResultPanel({
  result,
  strategy,
}: {
  result: QuestionPreviewResult;
  strategy: GenerationStrategy;
}) {
  return (
    <div className="space-y-4 mt-2">
      {/* Strategy Badge */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STRATEGY_BADGE_COLORS[strategy]}`}>
          {strategy} Strategy
        </span>
        <span className="text-xs text-gray-500">
          {(result.context?.metadata as any)?.contextSummary ?? ''}
        </span>
      </div>

      {/* Question Text */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b font-medium text-sm text-gray-700 dark:text-gray-300">
          Question
        </div>
        <div className="p-4 bg-white dark:bg-gray-950 text-sm leading-relaxed">
          {result.previewText}
        </div>
      </div>

      {/* Options */}
      {result.options && result.options.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b font-medium text-sm text-gray-700 dark:text-gray-300">
            Options
          </div>
          <div className="p-4 bg-white dark:bg-gray-950 space-y-2">
            {result.options.map((opt, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md ${
                  opt.startsWith(result.correctAnswer + '.')
                    ? 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {opt.startsWith(result.correctAnswer + '.') && (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                {opt}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correct Answer */}
      {result.correctAnswer && (
        <div className="flex items-center gap-2 text-sm px-4 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="font-medium text-green-800 dark:text-green-300">
            Correct Answer: {result.correctAnswer}
          </span>
        </div>
      )}

      {/* Explanation */}
      {result.explanation && (
        <div className="border rounded-md overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b font-medium text-sm text-gray-700 dark:text-gray-300">
            Explanation
          </div>
          <div className="p-4 bg-white dark:bg-gray-950 text-sm leading-relaxed">
            {result.explanation}
          </div>
        </div>
      )}

      {/* Context Summary / Metadata */}
      {result.context && (
        <div className="border rounded-md overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b font-medium text-sm text-gray-700 dark:text-gray-300">
            Context Summary
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 font-mono text-xs text-gray-700 dark:text-gray-300">
            <pre className="whitespace-pre-wrap">{JSON.stringify(result.context.metadata, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Validation Report Widget ──────────────────────────────────────────────────

function ValidationReportWidget({ report }: { report: ValidationReport }) {
  if (report.valid && report.warnings.length === 0) return null;

  return (
    <div className={`p-3 rounded-md border text-sm space-y-2 ${
      report.valid
        ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
        : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
    }`}>
      {report.errors.map((err, i) => (
        <div key={i} className="flex items-start gap-2 text-red-700 dark:text-red-400">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {err}
        </div>
      ))}
      {report.warnings.map((warn, i) => (
        <div key={i} className="flex items-start gap-2 text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {warn}
        </div>
      ))}
    </div>
  );
}

// ─── PreviewSection ────────────────────────────────────────────────────────────

/**
 * PreviewSection
 *
 * Strategy-aware: determines the correct context to include in the preview
 * request based on currentStrategy (from Zustand store).
 * Uses a single unified PreviewResultPanel regardless of strategy.
 * NEVER persists — only calls /question-generation/preview.
 */
export function PreviewSection() {
  const { id: templateId } = useParams() as { id: string };
  const { currentStrategy, configs } = useStrategyConfigStore();
  const previewMutation = usePreviewQuestion();
  const [result, setResult] = useState<QuestionPreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    setError(null);
    try {
      const strategyConfig = configs[currentStrategy as GenerationStrategy] ?? {};
      const res = await previewMutation.mutateAsync({
        templateId,
        context: { strategyConfig },
      });
      setResult(res);
    } catch (e: any) {
      setError(e?.message ?? 'Preview failed. Please try again.');
    }
  };

  return (
    <TemplateSection
      title="Question Preview"
      description="Generate a live preview of how this template produces a question — no data is saved."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Instructions + Trigger */}
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-4 text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>
              <strong>Strategy:</strong>{' '}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STRATEGY_BADGE_COLORS[currentStrategy as GenerationStrategy]}`}>
                {currentStrategy}
              </span>
            </p>
            <p>
              {currentStrategy === 'VARIABLE' &&
                'Variables will be resolved and the question template will be hydrated.'}
              {currentStrategy === 'DATASET' &&
                'A dataset item matching your configured filters will be selected.'}
              {currentStrategy === 'HYBRID' &&
                'A relationship graph will be generated from your entity/relationship schema.'}
            </p>
            <p className="text-xs text-gray-400 italic">
              Preview never persists. Click Generate to save to the question pool.
            </p>
          </div>

          <Button
            onClick={handlePreview}
            disabled={previewMutation.isPending}
            className="w-full gap-2"
          >
            {previewMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {previewMutation.isPending ? 'Generating Preview...' : 'Preview Question'}
          </Button>

          {error && (
            <div className="flex items-start gap-2 p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
              <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Right: Unified Result Panel */}
        <div>
          {result ? (
            <UnifiedPreviewResultPanel
              result={result}
              strategy={currentStrategy as GenerationStrategy}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded-lg text-gray-400 text-sm">
              <Eye className="w-8 h-8 mb-2 opacity-40" />
              Preview will appear here
            </div>
          )}
        </div>
      </div>
    </TemplateSection>
  );
}
