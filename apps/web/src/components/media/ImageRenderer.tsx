import React from 'react';
import { cn } from '@/lib/utils';

interface ImageRendererProps {
  url: string;
  altText?: string | null;
  className?: string;
  maxHeight?: string;
}

export function ImageRenderer({ url, altText, className, maxHeight = 'max-h-64' }: ImageRendererProps) {
  if (!url) return null;

  return (
    <div className={cn('my-2 flex items-center justify-center', className)}>
      <img
        src={url}
        alt={altText || 'Question diagram'}
        className={cn('rounded-md border bg-background object-contain shadow-sm', maxHeight)}
        loading="lazy"
      />
    </div>
  );
}
