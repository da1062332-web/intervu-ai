import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImagePreviewProps {
  url: string;
  altText?: string | null;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
}

export function ImagePreview({ url, altText, onRemove, disabled, className }: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={cn("relative inline-block", className)}>
      <div className={cn(
        "relative rounded border overflow-hidden bg-muted flex items-center justify-center",
        isLoading ? "animate-pulse" : "",
        hasError ? "bg-muted/50" : ""
      )}>
        {hasError ? (
          <div className="flex flex-col items-center justify-center p-3 text-muted-foreground h-32 w-32 text-center">
            <ImageIcon className="w-8 h-8 mb-1 opacity-30 text-destructive" />
            <span className="text-xs font-medium text-destructive mb-1">Failed to load</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary underline truncate max-w-full hover:opacity-80"
              title={url}
              onClick={(e) => e.stopPropagation()}
            >
              Open URL
            </a>
          </div>
        ) : (
          <img
            src={url}
            alt={altText || 'Image preview'}
            className={cn(
              "max-h-32 object-contain transition-opacity duration-300",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        )}
      </div>

      {onRemove && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full shadow-md"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          disabled={disabled}
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}
