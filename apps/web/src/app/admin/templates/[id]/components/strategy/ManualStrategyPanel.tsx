'use client';

import React, { useState, useEffect } from 'react';
import { TemplateSection } from '../TemplateSection';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { QuestionImageAttachment } from '@/components/media/QuestionImageAttachment';
import { ImagePreview } from '@/components/media/ImagePreview';
import { ImagePicker } from '@/components/media/ImagePicker';
import { ImageUploader } from '@/components/media/ImageUploader';
import { Modal } from '@/components/ui/modal';
import { useStrategyConfigStore } from '@/store/strategy-config.store';
import type { StrategyPanelProps } from '../../registry/strategy-panel.registry';
import { OptionMode, MediaAsset } from '@/services/media/types';
import { FileQuestion, Layers, Plus } from 'lucide-react';

interface RichOption {
  key: string;
  mode: OptionMode;
  text: string;
  mediaId: string | null;
  mediaUrl: string | null;
  isCorrect: boolean;
}

export function ManualStrategyPanel({ templateId, template }: StrategyPanelProps) {
  const { configs, updateConfig } = useStrategyConfigStore();
  const manualConfig = (configs.MANUAL as Record<string, any>) || {};

  const rawQuestionText = manualConfig.questionText || template?.structure?.stem || (template?.name !== 'New Template' ? template?.name : '') || '';
  const [questionText, setQuestionText] = useState<string>(rawQuestionText);
  const [questionMedia, setQuestionMedia] = useState<{ mediaId: string; mediaUrl: string; altText?: string } | null>(
    manualConfig.questionMedia || null
  );

  const [richOptions, setRichOptions] = useState<RichOption[]>(() => {
    if (Array.isArray(manualConfig.richOptions) && manualConfig.richOptions.length > 0) {
      return manualConfig.richOptions;
    }
    if (Array.isArray(manualConfig.options) && manualConfig.options.length > 0) {
      return manualConfig.options.map((opt: any, idx: number) => ({
        key: opt.key || String.fromCharCode(65 + idx),
        mode: opt.mode || 'text-only',
        text: typeof opt === 'string' ? opt : opt.text || '',
        mediaId: opt.mediaId || null,
        mediaUrl: opt.mediaUrl || null,
        isCorrect: typeof opt.isCorrect === 'boolean' ? opt.isCorrect : idx === 0,
      }));
    }
    return [
      { key: 'A', mode: 'text-only', text: '', mediaId: null, mediaUrl: null, isCorrect: true },
      { key: 'B', mode: 'text-only', text: '', mediaId: null, mediaUrl: null, isCorrect: false },
      { key: 'C', mode: 'text-only', text: '', mediaId: null, mediaUrl: null, isCorrect: false },
      { key: 'D', mode: 'text-only', text: '', mediaId: null, mediaUrl: null, isCorrect: false },
    ];
  });

  const [pickerOptIdx, setPickerOptIdx] = useState<number | null>(null);
  const [uploaderOptIdx, setUploaderOptIdx] = useState<number | null>(null);

  useEffect(() => {
    const correctOpt = richOptions.find((opt) => opt.isCorrect);
    updateConfig({
      manualStrategyMode: 'PRE_AUTHORED',
      questionText,
      questionMedia,
      richOptions,
      questionMediaId: questionMedia?.mediaId || null,
      correctAnswer: correctOpt?.key || 'A',
      correctOptionKey: correctOpt?.key || 'A',
      options: richOptions.map((opt) => ({
        key: opt.key,
        mode: opt.mode,
        text: opt.text,
        mediaId: opt.mediaId,
        mediaUrl: opt.mediaUrl,
        isCorrect: opt.isCorrect,
      })),
    });
  }, [questionText, questionMedia, richOptions, updateConfig]);

  const handleModeChange = (optIdx: number, mode: OptionMode) => {
    const updated = [...richOptions];
    updated[optIdx] = { ...updated[optIdx], mode };
    setRichOptions(updated);
  };

  const handleTextChange = (optIdx: number, text: string) => {
    const updated = [...richOptions];
    updated[optIdx] = { ...updated[optIdx], text };
    setRichOptions(updated);
  };

  const handleImageSelect = (optIdx: number, asset: MediaAsset) => {
    const updated = [...richOptions];
    updated[optIdx] = {
      ...updated[optIdx],
      mediaId: asset.id,
      mediaUrl: asset.url,
    };
    setRichOptions(updated);
    setPickerOptIdx(null);
    setUploaderOptIdx(null);
  };

  const handleImageRemove = (optIdx: number) => {
    const updated = [...richOptions];
    updated[optIdx] = {
      ...updated[optIdx],
      mediaId: null,
      mediaUrl: null,
    };
    setRichOptions(updated);
  };

  const handleCorrectChange = (optIdx: number) => {
    const updated = richOptions.map((opt, idx) => ({
      ...opt,
      isCorrect: idx === optIdx,
    }));
    setRichOptions(updated);
  };

  return (
    <div className="space-y-6">
      <TemplateSection
        title="Manual Question Strategy Configuration"
        description="Configure pre-authored static questions (with optional diagrams and rich image/text options) to bind directly to this template."
      >
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md flex items-start space-x-3">
          <FileQuestion className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Manual Strategy:</strong> Bypasses AI/formula generation. When this template is included in an assessment, candidates will be presented with the exact pre-authored question stem, diagrams, and options defined here.
          </div>
        </div>
      </TemplateSection>

      <div className="p-6 border rounded-lg bg-card space-y-6 shadow-sm">
        <div className="flex items-center space-x-2 pb-2 border-b">
          <Layers className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">Question Content & Media</h3>
        </div>

        {/* Question Text */}
        <div className="space-y-2">
          <Label htmlFor="manualQuestionText" className="font-medium">
            Question Text / Prompt *
          </Label>
          <textarea
            id="manualQuestionText"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Enter the static question text or instructions..."
          />
        </div>

        {/* Question Level Diagram */}
        <QuestionImageAttachment
          value={questionMedia}
          onChange={setQuestionMedia}
        />

        {/* MCQ Options */}
        <div className="space-y-4 pt-4 border-t">
          <Label className="font-semibold text-base">Options & Answer Settings</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {richOptions.map((opt, optIdx) => (
              <div
                key={opt.key}
                className={`flex flex-col space-y-3 p-3.5 border rounded-lg transition-colors ${
                  opt.isCorrect
                    ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-input bg-background'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${opt.isCorrect ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                    Option {opt.key}
                  </span>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="manual-correct"
                      className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                      checked={opt.isCorrect}
                      onChange={() => handleCorrectChange(optIdx)}
                    />
                    <span className={`text-xs font-medium ${opt.isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                      Correct
                    </span>
                  </label>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-muted-foreground font-medium">Mode:</span>
                  <select
                    className="flex h-7 rounded border border-input bg-background px-2 py-0 text-xs font-medium focus:ring-1 focus:ring-primary"
                    value={opt.mode}
                    onChange={(e) => handleModeChange(optIdx, e.target.value as OptionMode)}
                  >
                    <option value="text-only">Text Only</option>
                    <option value="diagram-only">Diagram Only</option>
                    <option value="diagram-text">Diagram + Text</option>
                  </select>
                </div>

                {opt.mode !== 'diagram-only' && (
                  <textarea
                    className="flex min-h-[50px] w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder={`Enter text for Option ${opt.key}...`}
                    value={opt.text}
                    onChange={(e) => handleTextChange(optIdx, e.target.value)}
                  />
                )}

                {opt.mode !== 'text-only' && (
                  <div className="pt-1">
                    {opt.mediaUrl ? (
                      <div className="p-2 border rounded bg-muted/20 flex items-center justify-between">
                        <ImagePreview url={opt.mediaUrl} onRemove={() => handleImageRemove(optIdx)} />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => setUploaderOptIdx(optIdx)}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Upload Image
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => setPickerOptIdx(optIdx)}
                        >
                          Select Existing
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ImagePicker
        isOpen={pickerOptIdx !== null}
        onClose={() => setPickerOptIdx(null)}
        onSelect={(asset) => pickerOptIdx !== null && handleImageSelect(pickerOptIdx, asset)}
        selectedId={pickerOptIdx !== null ? richOptions[pickerOptIdx]?.mediaId : null}
      />

      <Modal
        isOpen={uploaderOptIdx !== null}
        onClose={() => setUploaderOptIdx(null)}
        className="max-w-md"
      >
        <div className="space-y-3 p-1">
          <h3 className="text-base font-semibold">Upload Option Image</h3>
          {uploaderOptIdx !== null && (
            <ImageUploader
              onUploaded={(asset) => handleImageSelect(uploaderOptIdx, asset)}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
