import React, { useCallback, useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MediaAsset } from '@/services/media/types';
import { useUploadImage } from '@/services/media/hooks';

interface ImageUploaderProps {
  onUploaded: (asset: MediaAsset) => void;
  disabled?: boolean;
  className?: string;
}

export function ImageUploader({ onUploaded, disabled, className }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useUploadImage();

  const handleFile = async (file: File) => {
    if (disabled || uploadImage.isPending) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      const asset = await uploadImage.mutateAsync({ file });
      toast.success('Image uploaded successfully');
      onUploaded(asset);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to upload image';
      toast.error(msg);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [disabled]);

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:bg-accent/50',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !disabled && !uploadImage.isPending && fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
        disabled={disabled || uploadImage.isPending}
      />
      
      {uploadImage.isPending ? (
        <div className="flex flex-col items-center space-y-2 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-2 text-muted-foreground">
          <Upload className="w-8 h-8" />
          <p className="text-sm font-medium">Click to upload or drag and drop</p>
          <p className="text-xs">PNG, JPG or WebP (max 5MB)</p>
        </div>
      )}
    </div>
  );
}
