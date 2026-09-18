'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { QuestionImageAttachment } from '@/components/media/QuestionImageAttachment';
import { ImagePreview } from '@/components/media/ImagePreview';
import { ImagePicker } from '@/components/media/ImagePicker';
import { ImageRenderer } from '@/components/media/ImageRenderer';
import { Modal } from '@/components/ui/modal';
import { ImageUploader } from '@/components/media/ImageUploader';
import { useUpdateTemplate } from '@/services/templates/hooks';
import { OptionMode, MediaAsset } from '@/services/media/types';
import {
  FileQuestion,
  Layers,
  Plus,
  Save,
  CheckCircle2,
  Eye,
  Sparkles,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface RichOption {
  key: string;
  mode: OptionMode;
  text: string;
  mediaId: string | null;
  mediaUrl: string | null;
  isCorrect: boolean;
}

interface ManualQuestionEditorSectionProps {
  template: any;
}

export function ManualQuestionEditorSection({ template }: ManualQuestionEditorSectionProps) {
  const { mutate: updateTemplate, isPending: isSaving } = useUpdateTemplate();

  const config = template?.config || {};
  const structure = template?.structure || {};

  const [questionText, setQuestionText] = useState<string>(
    config.questionText || structure.stem || template?.name || ''
  );
  const [questionMedia, setQuestionMedia] = useState<{ mediaId: string; mediaUrl: string; altText?: string } | null>(
    config.questionMedia || structure.media || null
  );

  const [richOptions, setRichOptions] = useState<RichOption[]>(() => {
    if (Array.isArray(config.richOptions) && config.richOptions.length > 0) {
      return config.richOptions;
    }
    if (Array.isArray(config.options) && config.options.length > 0) {
      return config.options;
    }
    return [
      { key: 'A', mode: 'text-only', text: 'Option A text', mediaId: null, mediaUrl: null, isCorrect: true },
      { key: 'B', mode: 'text-only', text: 'Option B text', mediaId: null, mediaUrl: null, isCorrect: false },
      { key: 'C', mode: 'text-only', text: 'Option C text', mediaId: null, mediaUrl: null, isCorrect: false },
      { key: 'D', mode: 'text-only', text: 'Option D text', mediaId: null, mediaUrl: null, isCorrect: false },
    ];
  });

  const [solutionExplanation, setSolutionExplanation] = useState<string>(
    config.solutionExplanation || structure.solution || ''
  );

  // Sync state when template updates externally
  useEffect(() => {
    if (config.questionText || structure.stem) {
      setQuestionText(config.questionText || structure.stem || '');
    }
    if (config.questionMedia || structure.media) {
      setQuestionMedia(config.questionMedia || structure.media || null);
    }
    if (Array.isArray(config.richOptions) && config.richOptions.length > 0) {
      setRichOptions(config.richOptions);
    }
    if (config.solutionExplanation || structure.solution) {
      setSolutionExplanation(config.solutionExplanation || structure.solution || '');
    }
  }, [template?.id]);

  const [pickerOptIdx, setPickerOptIdx] = useState<number | null>(null);
  const [uploaderOptIdx, setUploaderOptIdx] = useState<number | null>(null);
  const [previewSelectedOpt, setPreviewSelectedOpt] = useState<string | null>(null);

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

  const handleSave = () => {
    if (!questionText.trim()) {
      toast.error('Question text cannot be empty.');
      return;
    }

    const payload = {
      name: template.name,
      description: template.description,
      difficulty: template.difficulty || 'MEDIUM',
      difficultyLevel: template.difficultyLevel || 'MEDIUM',
      conceptKey: template.conceptKey,
      questionType: template.questionType || 'MULTIPLE_CHOICE',
      generationStrategy: 'MANUAL',
      isActive: template.isActive,
      structure: {
        stem: questionText,
        options: richOptions.map((opt) => opt.text),
        correctAnswer: richOptions.find((opt) => opt.isCorrect)?.key || 'A',
        media: questionMedia,
        solution: solutionExplanation,
      },
      config: {
        ...config,
        manualStrategyMode: 'PRE_AUTHORED',
        questionText,
        questionMedia,
        richOptions,
        options: richOptions,
        questionMediaId: questionMedia?.mediaId || null,
        solutionExplanation,
      },
    };

    updateTemplate(
      { templateId: template.id, payload },
      {
        onSuccess: () => {
          toast.success('Manual question saved successfully!');
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Failed to save manual question.');
        },
      }
    );
  };

  const correctOption = richOptions.find((o) => o.isCorrect);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start justify-between shadow-sm">
        <div className="flex items-start space-x-3">
          <FileQuestion className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
              Manual Question & Candidate Preview Editor
            </h2>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
              Directly author the static question stem, diagrams, choices, and solution. Candidates will receive this exact pre-authored question in test assessments without any AI generation required.
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shrink-0 ml-4 gap-2"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Manual Question
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Authoring Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Question Stem & Media Section */}
          <div className="p-5 border rounded-xl bg-card space-y-5 shadow-sm">
            <div className="flex items-center space-x-2 pb-2 border-b">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">1. Question Content & Diagram</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manualQuestionText" className="font-medium text-xs">
                Question Prompt / Stem *
              </Label>
              <textarea
                id="manualQuestionText"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Enter the static question text or prompt for candidates..."
              />
            </div>

            <div className="space-y-1">
              <Label className="font-medium text-xs">Question Diagram (Optional)</Label>
              <QuestionImageAttachment value={questionMedia} onChange={setQuestionMedia} />
            </div>
          </div>

          {/* Options & Correct Answer Section */}
          <div className="p-5 border rounded-xl bg-card space-y-5 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold">2. MCQ Options & Correct Answer</h3>
              </div>
              <span className="text-xs text-muted-foreground">Select radio to set correct option</span>
            </div>

            <div className="space-y-4">
              {richOptions.map((opt, optIdx) => (
                <div
                  key={opt.key}
                  className={`flex flex-col space-y-3 p-4 border rounded-xl transition-all ${
                    opt.isCorrect
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
                      : 'border-input bg-background'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          opt.isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="text-sm font-semibold">Option {opt.key}</span>
                    </div>

                    <label className="flex items-center space-x-2 cursor-pointer bg-background px-2.5 py-1 rounded-md border text-xs font-medium hover:bg-muted/50">
                      <input
                        type="radio"
                        name="manual-correct"
                        className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                        checked={opt.isCorrect}
                        onChange={() => handleCorrectChange(optIdx)}
                      />
                      <span className={opt.isCorrect ? 'text-emerald-700 font-semibold' : 'text-muted-foreground'}>
                        {opt.isCorrect ? 'Correct Answer' : 'Mark as Correct'}
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-muted-foreground font-medium">Display Mode:</span>
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
                      className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder={`Enter text for Option ${opt.key}...`}
                      value={opt.text}
                      onChange={(e) => handleTextChange(optIdx, e.target.value)}
                    />
                  )}

                  {opt.mode !== 'text-only' && (
                    <div className="pt-1">
                      {opt.mediaUrl ? (
                        <div className="p-2 border rounded-lg bg-muted/20 flex items-center justify-between">
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

          {/* Solution Explanation Section */}
          <div className="p-5 border rounded-xl bg-card space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 pb-2 border-b">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold">3. Solution & Explanation</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manualSolution" className="font-medium text-xs">
                Solution Explanation (Shown after test submission)
              </Label>
              <textarea
                id="manualSolution"
                value={solutionExplanation}
                onChange={(e) => setSolutionExplanation(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Explain why the correct answer is right..."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Candidate Preview Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6 p-5 border rounded-xl bg-card space-y-5 shadow-sm border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-b from-card to-indigo-50/20 dark:to-indigo-950/20">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-indigo-900">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-semibold text-indigo-950 dark:text-indigo-200">
                  Live Candidate View
                </h3>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                Live Preview
              </span>
            </div>

            {/* Candidate Question Card */}
            <div className="space-y-4 bg-background p-4 rounded-xl border shadow-sm">
              {/* Question Stem */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                  Question Prompt
                </span>
                <p className="text-sm font-medium leading-relaxed text-foreground whitespace-pre-wrap">
                  {questionText || <span className="text-muted-foreground italic">No question text entered yet...</span>}
                </p>
              </div>

              {/* Question Diagram */}
              {questionMedia?.mediaUrl && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block mb-1">
                    Question Diagram
                  </span>
                  <ImageRenderer url={questionMedia.mediaUrl} altText="Question diagram" maxHeight="max-h-56" />
                </div>
              )}

              {/* Candidate Options List */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">
                  Select Answer
                </span>
                <div className="space-y-2">
                  {richOptions.map((opt) => (
                    <div
                      key={opt.key}
                      onClick={() => setPreviewSelectedOpt(opt.key)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start space-x-3 ${
                        previewSelectedOpt === opt.key
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/50 ring-1 ring-indigo-500'
                          : opt.isCorrect
                          ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20'
                          : 'border-input hover:border-gray-300 bg-card'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          previewSelectedOpt === opt.key
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-gray-400'
                        }`}
                      >
                        {previewSelectedOpt === opt.key && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        )}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            Option {opt.key}
                          </span>
                          {opt.isCorrect && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              Correct Choice
                            </span>
                          )}
                        </div>

                        {opt.mode !== 'diagram-only' && opt.text && (
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{opt.text}</p>
                        )}

                        {opt.mode !== 'text-only' && opt.mediaUrl && (
                          <div className="pt-1">
                            <ImageRenderer url={opt.mediaUrl} altText={`Option ${opt.key}`} maxHeight="max-h-36" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Correct Answer Badge */}
              {correctOption && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      Configured Answer: <strong>Option {correctOption.key}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Solution Preview */}
              {solutionExplanation && (
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-amber-900 dark:text-amber-200 flex items-center space-x-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>Solution Explanation Preview</span>
                  </div>
                  <p className="text-amber-800 dark:text-amber-300 leading-relaxed whitespace-pre-wrap">
                    {solutionExplanation}
                  </p>
                </div>
              )}
            </div>

            {/* Direct Save Action in Preview Card */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Manual Question...
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Manual Question
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Modals for Image Picking & Uploading */}
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
          <h3 className="text-sm font-semibold">Upload Option Image</h3>
          {uploaderOptIdx !== null && (
            <ImageUploader
              onUploaded={(asset: MediaAsset) => handleImageSelect(uploaderOptIdx, asset)}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
