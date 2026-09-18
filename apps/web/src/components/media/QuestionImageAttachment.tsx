import React, { useState } from 'react';
import { Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImageUploader } from './ImageUploader';
import { ImagePicker } from './ImagePicker';
import { ImagePreview } from './ImagePreview';
import { MediaAsset } from '@/services/media/types';

interface QuestionImageAttachmentProps {
  value?: { mediaId: string; mediaUrl: string; altText?: string } | null;
  onChange: (attachment: { mediaId: string; mediaUrl: string; altText?: string } | null) => void;
  disabled?: boolean;
}

export function QuestionImageAttachment({ value, onChange, disabled }: QuestionImageAttachmentProps) {
  const [showUploader, setShowUploader] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const handleSelect = (asset: MediaAsset) => {
    onChange({
      mediaId: asset.id,
      mediaUrl: asset.url,
      altText: asset.altText || undefined,
    });
    setShowUploader(false);
    setShowPicker(false);
  };

  return (
    <div className="space-y-2 p-3 border rounded-lg bg-muted/20">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center space-x-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          <span>Question Diagram / Image (Optional)</span>
        </Label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-destructive hover:text-destructive"
            onClick={() => onChange(null)}
            disabled={disabled}
          >
            Clear Image
          </Button>
        )}
      </div>

      {value ? (
        <div className="flex items-center space-x-4 p-2 bg-background border rounded-md">
          <ImagePreview url={value.mediaUrl} altText={value.altText} onRemove={() => onChange(null)} disabled={disabled} />
          <div className="text-xs space-y-1">
            <p className="font-medium text-muted-foreground">Attached Image</p>
            <p className="text-muted-foreground/70 truncate max-w-xs">ID: {value.mediaId}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-7 mt-1"
              onClick={() => setShowPicker(true)}
              disabled={disabled}
            >
              Change Image
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
        <div className="flex items-center space-x-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setShowUploader(true)}
            disabled={disabled}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Upload Image
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setShowPicker(true)}
            disabled={disabled}
          >
            Select Existing Image
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
