import React, { useState } from 'react';
import { Image as ImageIcon, Code2, Plus, FileCode, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImageUploader } from './ImageUploader';
import { ImagePicker } from './ImagePicker';
import { ImagePreview } from './ImagePreview';
import { SvgRenderer } from './SvgRenderer';
import { MediaAsset } from '@/services/media/types';

interface QuestionImageAttachmentProps {
  value?: { mediaId?: string; mediaUrl?: string; svgCode?: string; altText?: string } | null;
  onChange: (attachment: { mediaId?: string; mediaUrl?: string; svgCode?: string; altText?: string } | null) => void;
  disabled?: boolean;
}

export function QuestionImageAttachment({ value, onChange, disabled }: QuestionImageAttachmentProps) {
  const [showUploader, setShowUploader] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showInlineSvg, setShowInlineSvg] = useState(Boolean(value?.svgCode));
  const [tempSvgInput, setTempSvgInput] = useState(value?.svgCode || '');

  const handleSelect = (asset: MediaAsset) => {
    onChange({
      mediaId: asset.id,
      mediaUrl: asset.url,
      altText: asset.altText || undefined,
    });
    setShowUploader(false);
    setShowPicker(false);
    setShowInlineSvg(false);
  };

  const handleSaveInlineSvg = () => {
    if (!tempSvgInput.trim()) {
      onChange(null);
      setShowInlineSvg(false);
      return;
    }
    onChange({
      svgCode: tempSvgInput.trim(),
      altText: 'Inline SVG Vector Diagram',
    });
  };

  return (
    <div className="space-y-3 p-3.5 border rounded-lg bg-muted/20">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center space-x-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          <span>Question Diagram / Media Attachment (Optional)</span>
        </Label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-destructive hover:text-destructive"
            onClick={() => {
              onChange(null);
              setShowInlineSvg(false);
              setTempSvgInput('');
            }}
            disabled={disabled}
          >
            Clear Media
          </Button>
        )}
      </div>

      {value?.svgCode ? (
        <div className="space-y-3 p-3 bg-background border rounded-md">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <FileCode className="w-4 h-4" /> Inline SVG Vector Graphic Attached
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => setShowInlineSvg(!showInlineSvg)}
              disabled={disabled}
            >
              {showInlineSvg ? 'Hide Editor' : 'Edit SVG Code'}
            </Button>
          </div>

          <SvgRenderer svgCode={value.svgCode} maxHeight="max-h-60" />

          {showInlineSvg && (
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs font-medium">Raw SVG XML Code</Label>
              <textarea
                value={tempSvgInput}
                onChange={(e) => setTempSvgInput(e.target.value)}
                rows={5}
                className="w-full rounded-md border border-input bg-mono px-3 py-2 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="<svg viewBox='0 0 100 100'>...</svg>"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  className="text-xs h-8"
                  onClick={handleSaveInlineSvg}
                >
                  <Check className="w-3.5 h-3.5 mr-1" /> Update SVG Vector
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : value?.mediaUrl ? (
        <div className="flex items-center space-x-4 p-2 bg-background border rounded-md">
          <ImagePreview url={value.mediaUrl} altText={value.altText} onRemove={() => onChange(null)} disabled={disabled} />
          <div className="text-xs space-y-1">
            <p className="font-medium text-muted-foreground">Attached Image / File</p>
            <p className="text-muted-foreground/70 truncate max-w-xs">ID: {value.mediaId}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-7 mt-1"
              onClick={() => setShowPicker(true)}
              disabled={disabled}
            >
              Change File
            </Button>
          </div>
        </div>
      ) : showInlineSvg ? (
        <div className="space-y-3 p-3 bg-background border rounded-md">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold flex items-center space-x-1.5">
              <Code2 className="w-4 h-4 text-primary" />
              <span>Inline SVG XML Vector Code</span>
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => setShowInlineSvg(false)}
            >
              Cancel
            </Button>
          </div>
          <textarea
            value={tempSvgInput}
            onChange={(e) => setTempSvgInput(e.target.value)}
            rows={5}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="<svg viewBox='0 0 100 100'>...</svg>"
          />
          {tempSvgInput.trim() && (
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Live Vector Preview:</span>
              <SvgRenderer svgCode={tempSvgInput} maxHeight="max-h-48" />
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-1">
            <Button
              type="button"
              size="sm"
              className="text-xs h-8"
              onClick={handleSaveInlineSvg}
              disabled={!tempSvgInput.trim()}
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Save SVG Graphic
            </Button>
          </div>
        </div>
      ) : showUploader ? (
        <div className="space-y-2">
          <ImageUploader onUploaded={handleSelect} disabled={disabled} />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowUploader(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setShowUploader(true)}
            disabled={disabled}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Upload Image / SVG File
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setShowPicker(true)}
            disabled={disabled}
          >
            Select Existing Asset
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
            onClick={() => {
              setShowInlineSvg(true);
              setTempSvgInput('');
            }}
            disabled={disabled}
          >
            <Code2 className="w-3.5 h-3.5 mr-1" /> Paste Raw SVG Code
          </Button>
        </div>
      )}

      <ImagePicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleSelect}
        selectedId={value?.mediaId}
      />
    </div>
  );
}
