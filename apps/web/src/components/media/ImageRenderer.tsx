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

  let src = url;
  if (
    url &&
    !url.startsWith('http://') &&
    !url.startsWith('https://') &&
    !url.startsWith('data:') &&
    !url.startsWith('blob:')
  ) {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    src = `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  return (
    <div className={cn('my-2 flex items-center justify-center', className)}>
      <img
        src={src}
        alt={altText || 'Question diagram'}
        className={cn('rounded-md border bg-background object-contain shadow-sm', maxHeight)}
        loading="lazy"
      />
    </div>
  );
}
