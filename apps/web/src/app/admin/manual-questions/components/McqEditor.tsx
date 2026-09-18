import React, { useState } from 'react';
import { useFormContext, useController } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ImagePreview } from '@/components/media/ImagePreview';
import { ImagePicker } from '@/components/media/ImagePicker';
import { ImageUploader } from '@/components/media/ImageUploader';
import { Modal } from '@/components/ui/modal';
import { OptionMode, MediaAsset } from '@/services/media/types';

export interface RichOptionState {
  key: string;
  mode: OptionMode;
  text: string;
  mediaId: string | null;
  mediaUrl: string | null;
}

interface McqEditorProps {
  index: number;
  disabled?: boolean;
}

export function McqEditor({ index, disabled }: McqEditorProps) {
  const { register, watch, setValue } = useFormContext();

  const { field: richOptionsField } = useController({
    name: `questions.${index}.richOptions`,
    defaultValue: [
      { key: 'A', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
      { key: 'B', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
      { key: 'C', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
      { key: 'D', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
    ],
  });

  const richOptions: RichOptionState[] =
    Array.isArray(richOptionsField.value) && richOptionsField.value.length === 4
      ? richOptionsField.value
      : [
          { key: 'A', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
          { key: 'B', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
          { key: 'C', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
          { key: 'D', mode: 'text-only', text: '', mediaId: null, mediaUrl: null },
        ];

  const correctIndexStr = watch(`questions.${index}.mcqCorrectIndex`) ?? '0';

  const [pickerOptIdx, setPickerOptIdx] = useState<number | null>(null);
  const [uploaderOptIdx, setUploaderOptIdx] = useState<number | null>(null);

  const updateOptions = (newRichOptions: RichOptionState[]) => {
    richOptionsField.onChange(newRichOptions);

    // Sync legacy options array
    const legacyOpts = newRichOptions.map((o) => o.text || o.key);
    setValue(`questions.${index}.options`, legacyOpts, { shouldDirty: true });

    // Sync correct answer
    const currentCorrectIdx = Number(correctIndexStr) || 0;
    const correctOpt = newRichOptions[currentCorrectIdx] || newRichOptions[0];
    const answerVal = correctOpt.mode === 'diagram-only' ? correctOpt.key : correctOpt.text || correctOpt.key;
    setValue(`questions.${index}.answer`, answerVal, { shouldValidate: true, shouldDirty: true });
  };

  const handleModeChange = (optIdx: number, mode: OptionMode) => {
    const updated = [...richOptions];
    updated[optIdx] = { ...updated[optIdx], mode };
    updateOptions(updated);
  };

  const handleTextChange = (optIdx: number, text: string) => {
    const updated = [...richOptions];
    updated[optIdx] = { ...updated[optIdx], text };
    updateOptions(updated);
  };

  const handleImageSelect = (optIdx: number, asset: MediaAsset) => {
    const updated = [...richOptions];
    updated[optIdx] = {
      ...updated[optIdx],
      mediaId: asset.id,
      mediaUrl: asset.url,
    };
    updateOptions(updated);
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
    updateOptions(updated);
  };

  const handleCorrectChange = (optIdx: number) => {
    setValue(`questions.${index}.mcqCorrectIndex`, String(optIdx), {
      shouldValidate: true,
      shouldDirty: true,
    });
    const correctOpt = richOptions[optIdx];
    const answerVal = correctOpt.mode === 'diagram-only' ? correctOpt.key : correctOpt.text || correctOpt.key;
    setValue(`questions.${index}.answer`, answerVal, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div className='space-y-4 p-4 border rounded-lg bg-gray-50/30 dark:bg-gray-900/30'>
      <div className='flex items-center justify-between mb-2'>
        <div>
          <Label className='text-sm font-semibold'>Multiple Choice Options</Label>
          <p className='text-xs text-muted-foreground mt-1'>
            Configure 4 options using text, diagram, or diagram+text mode, and select the correct answer.
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {richOptions.map((opt, optIdx) => {
          const isCorrect = String(optIdx) === String(correctIndexStr);
          return (
            <div
              key={opt.key}
              className={`flex flex-col space-y-3 p-3.5 border rounded-lg transition-colors ${
                isCorrect
                  ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                  : 'border-input bg-background'
              }`}
            >
              {/* Option Header */}
              <div className='flex items-center justify-between'>
                <span className={`text-sm font-semibold ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                  Option {opt.key}
                </span>
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='radio'
                    name={`correct-${index}`}
                    className='w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500'
                    checked={isCorrect}
                    onChange={() => handleCorrectChange(optIdx)}
                    disabled={disabled}
                  />
                  <span className={`text-xs font-medium ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                    Correct
                  </span>
                </label>
              </div>

              {/* Mode Selector */}
              <div className='flex items-center space-x-2 text-xs'>
                <span className='text-muted-foreground font-medium'>Mode:</span>
                <select
                  className='flex h-7 rounded border border-input bg-background px-2 py-0 text-xs font-medium focus:ring-1 focus:ring-primary'
                  value={opt.mode}
                  onChange={(e) => handleModeChange(optIdx, e.target.value as OptionMode)}
                  disabled={disabled}
                >
                  <option value='text-only'>Text Only</option>
                  <option value='diagram-only'>Diagram Only</option>
                  <option value='diagram-text'>Diagram + Text</option>
                </select>
              </div>

              {/* Option Text Input */}
              {opt.mode !== 'diagram-only' && (
                <div className='space-y-1'>
                  <textarea
                    className='flex min-h-[50px] w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                    placeholder={`Enter text for Option ${opt.key}...`}
                    value={opt.text}
                    onChange={(e) => handleTextChange(optIdx, e.target.value)}
                    disabled={disabled}
                  />
                </div>
              )}

              {/* Diagram / Image Controls */}
              {opt.mode !== 'text-only' && (
                <div className='pt-1'>
                  {opt.mediaUrl ? (
                    <div className='p-2 border rounded bg-muted/20 flex items-center justify-between'>
                      <ImagePreview url={opt.mediaUrl} onRemove={() => handleImageRemove(optIdx)} disabled={disabled} />
                    </div>
                  ) : (
                    <div className='flex items-center space-x-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='text-xs h-8'
                        onClick={() => setUploaderOptIdx(optIdx)}
                        disabled={disabled}
                      >
                        <Plus className='w-3.5 h-3.5 mr-1' /> Upload Image
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='text-xs h-8'
                        onClick={() => setPickerOptIdx(optIdx)}
                        disabled={disabled}
                      >
                        Select Existing
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
        className='max-w-md'
      >
        <div className='space-y-3 p-1'>
          <h3 className='text-base font-semibold'>Upload Option Image</h3>
          {uploaderOptIdx !== null && (
            <ImageUploader
              onUploaded={(asset) => handleImageSelect(uploaderOptIdx, asset)}
              disabled={disabled}
            />
          )}
        </div>
      </Modal>

      <input type='hidden' {...register(`questions.${index}.mcqCorrectIndex`)} />
      <input type='hidden' {...register(`questions.${index}.answer`)} />
    </div>
  );
}
