'use client';

import React, { useState } from 'react';
import { TemplateSection } from './TemplateSection';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useGeneratePreview } from '@/services/templates/hooks';

export function PreviewSection({ template }: { template?: any }) {
  const { id: templateId } = useParams() as { id: string };
  const { mutateAsync: generatePreview, isPending } = useGeneratePreview();
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    setError(null);
    try {
      const res = await generatePreview({
        templateId,
        payload: { previewPayload: {} },
      });
      const previewData = (res as any).previewResult || res;
      setResult(previewData);
    } catch (e: any) {
      const backendMessage = e?.response?.data?.message;
      const backendDetails = e?.response?.data?.details;
      const detailsText = Array.isArray(backendDetails)
        ? backendDetails.join(' | ')
        : backendDetails
        ? String(backendDetails)
        : null;

      setError(
        backendMessage
          ? `${backendMessage}${detailsText ? `: ${detailsText}` : ''}`
          : e?.message || 'Preview failed. Please try again.',
      );
    }
  };

  const currentStrategy = template?.generationStrategy || 'VARIABLE';

  return (
    <TemplateSection
      title="Question Preview"
      description="Generate a live preview of how this template produces a question using the latest saved template state."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Instructions + Trigger */}
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-4 text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>
              <strong>Strategy:</strong>{' '}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300`}>
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
              Preview never persists. Click Generate to test your configuration.
            </p>
          </div>

          <Button
            onClick={handlePreview}
            disabled={isPending}
            className="w-full gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {isPending ? 'Generating Preview...' : 'Generate Preview'}
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
            <div className="space-y-4 mt-2">
              
              {/* Dataset Record Used */}
              {result.context?.datasetRecord && (
                <div className="border rounded-md overflow-hidden border-indigo-200 dark:border-indigo-900">
                  <div className="bg-indigo-50 dark:bg-indigo-950/50 px-4 py-2 border-b border-indigo-200 dark:border-indigo-900 font-medium text-sm text-indigo-800 dark:text-indigo-300">
                    Dataset Record Used
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-950 text-sm leading-relaxed whitespace-pre-wrap font-mono text-gray-600 dark:text-gray-400">
                    {typeof result.context.datasetRecord === 'string' 
                      ? result.context.datasetRecord 
                      : JSON.stringify(result.context.datasetRecord, null, 2)}
                  </div>
                </div>
              )}

              {/* Question Text */}
              <div className="border rounded-md overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b font-medium text-sm text-gray-700 dark:text-gray-300">
                  Generated Question
                </div>
                <div className="p-4 bg-white dark:bg-gray-950 text-sm leading-relaxed whitespace-pre-wrap">
                  {result.questionText || result.previewText || result.solution}
                </div>
              </div>

              {/* Options */}
              {result.options && result.options.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b font-medium text-sm text-gray-700 dark:text-gray-300">
                    Options
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-950 space-y-2">
                    {result.options.map((opt: string, i: number) => {
                      // Some backends return the correct answer as the exact string in the array
                      const isCorrect = opt === result.correctAnswer || opt.startsWith(result.correctAnswer + '.');
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md ${
                            isCorrect
                              ? 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 font-medium'
                              : 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50'
                          }`}
                        >
                          {isCorrect && <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600 dark:text-green-400" />}
                          {!isCorrect && <span className="w-4 inline-block font-medium text-gray-400">{String.fromCharCode(65 + i)}.</span>}
                          {opt}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Correct Answer */}
              {result.correctAnswer && (
                <div className="flex items-center gap-2 text-sm px-4 py-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <span className="font-semibold text-green-800 dark:text-green-300 block text-xs uppercase tracking-wider mb-0.5">Correct Answer</span>
                    <span className="font-medium text-green-900 dark:text-green-100">{result.correctAnswer}</span>
                  </div>
                </div>
              )}

              {/* Explanation */}
              {result.explanation && (
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b font-medium text-sm text-gray-700 dark:text-gray-300">
                    Explanation
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-950 text-sm leading-relaxed whitespace-pre-wrap">
                    {result.explanation}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="border rounded-md overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b font-medium text-sm text-gray-700 dark:text-gray-300">
                  Metadata
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 text-xs text-gray-600 dark:text-gray-400 space-y-2 font-mono">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-semibold text-gray-500">Strategy:</span> {currentStrategy}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500">Difficulty:</span> {template?.difficulty || 'N/A'}
                    </div>
                    {result.context?.datasetId && (
                      <div className="col-span-2">
                        <span className="font-semibold text-gray-500">Dataset Used:</span> {result.context.datasetId}
                      </div>
                    )}
                    {result.context?.itemsUsed && (
                      <div className="col-span-2">
                        <span className="font-semibold text-gray-500">Items Used:</span> {result.context.itemsUsed}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded-lg text-gray-400 text-sm bg-gray-50/50 dark:bg-gray-900/20">
              <Eye className="w-8 h-8 mb-2 opacity-40" />
              Preview will appear here
            </div>
          )}
        </div>
      </div>
    </TemplateSection>
  );
}
