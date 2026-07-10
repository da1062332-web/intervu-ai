'use client';

import React, { useState } from 'react';
import { TemplateSection } from '../TemplateSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Database, Search, Tag } from 'lucide-react';
import { useDatasets } from '@/services/datasets/hooks';
import { useStrategyConfigStore } from '@/store/strategy-config.store';
import { validateStrategyConfig } from '../../registry/strategy-validation.registry';
import type { StrategyPanelProps } from '../../registry/strategy-panel.registry';
import type { Dataset } from '@/services/datasets/api';

/**
 * DatasetStrategyPanel
 *
 * Displays dataset type, topic, difficulty, tag filters, and a dataset browser.
 * Config is saved to Zustand store and validated with datasetStrategySchema.
 */
export function DatasetStrategyPanel({ templateId: _ }: StrategyPanelProps) {
  const { updateConfig, configs } = useStrategyConfigStore();
  const config = (configs['DATASET'] ?? {}) as Record<string, string | string[]>;

  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { data: datasets, isLoading } = useDatasets();

  const handleFieldChange = (field: string, value: string | string[]) => {
    updateConfig({ [field]: value });
    setValidationErrors([]);
  };

  const handleSave = () => {
    const result = validateStrategyConfig('DATASET', {
      ...config,
      selectedDatasetId,
    });
    if (!result.success) {
      const errors = (result as any).error.errors.map((e: any) => e.message);
      setValidationErrors(errors);
      return;
    }
    updateConfig({ datasetId: selectedDatasetId });
    setValidationErrors([]);
  };

  return (
    <div className="space-y-6">
      <TemplateSection
        title="Dataset Strategy Configuration"
        description="Select a dataset and configure filters that determine which passages or items are used to generate questions."
        actions={
          <Button onClick={handleSave} size="sm">
            Save Configuration
          </Button>
        }
      >
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md mb-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Dataset Strategy:</strong> Questions are generated based on a selected passage
            or vocabulary item from a dataset. Ideal for reading comprehension and contextual questions.
          </p>
        </div>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((err, i) => (
                <li key={i} className="text-sm text-red-700 dark:text-red-400">{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dataset Type */}
          <div className="space-y-2">
            <Label htmlFor="datasetType">
              <Database className="inline w-4 h-4 mr-1" />
              Dataset Type <span className="text-red-500">*</span>
            </Label>
            <select
              id="datasetType"
              value={(config.datasetType as string) ?? ''}
              onChange={(e) => handleFieldChange('datasetType', e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select dataset type...</option>
              <option value="READING_PASSAGE">Reading Passage</option>
              <option value="VOCABULARY">Vocabulary</option>
              <option value="SENTENCE">Sentence</option>
              <option value="PARAGRAPH">Paragraph</option>
            </select>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label htmlFor="difficulty">
              Difficulty <span className="text-red-500">*</span>
            </Label>
            <select
              id="difficulty"
              value={(config.difficulty as string) ?? ''}
              onChange={(e) => handleFieldChange('difficulty', e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select difficulty...</option>
              <option value="EASY">EASY</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HARD">HARD</option>
            </select>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">
              <Search className="inline w-4 h-4 mr-1" />
              Topic <span className="text-red-500">*</span>
            </Label>
            <Input
              id="topic"
              value={(config.topic as string) ?? ''}
              onChange={(e) => handleFieldChange('topic', e.target.value)}
              placeholder="e.g. synonyms, environment, history"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">
              <Tag className="inline w-4 h-4 mr-1" />
              Tags (comma separated)
            </Label>
            <Input
              id="tags"
              value={
                Array.isArray(config.tags) ? (config.tags as string[]).join(', ') : ((config.tags as string) ?? '')
              }
              onChange={(e) =>
                handleFieldChange(
                  'tags',
                  e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                )
              }
              placeholder="e.g. english, reading"
            />
          </div>
        </div>

        {/* Dataset Browser */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select Dataset
          </h3>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading datasets...
            </div>
          ) : !datasets || datasets.length === 0 ? (
            <div className="p-6 border border-dashed rounded-lg text-center text-sm text-gray-500">
              No datasets found. Create a dataset first.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {datasets.map((dataset: Dataset) => (
                <div
                  key={dataset.id}
                  onClick={() => setSelectedDatasetId(dataset.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedDatasetId === dataset.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{dataset.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Type: {dataset.type} · Items: {dataset._count?.items ?? 0}
                  </div>
                  {dataset.description && (
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {dataset.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </TemplateSection>
    </div>
  );
}
