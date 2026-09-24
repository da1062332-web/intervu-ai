'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface SvgRendererProps {
  svgCode?: string | null;
  className?: string;
  maxHeight?: string;
  altText?: string;
}

/**
 * Sanitizes and prepares SVG XML string for safe, responsive, theme-adaptive rendering.
 * Performs DOM-based XSS sanitization (strips script, event handlers, foreignObject, javascript: URIs).
 */
export function sanitizeAndFormatSvg(rawSvg: string): { cleanSvg: string; error?: string } {
  if (!rawSvg || !rawSvg.trim()) {
    return { cleanSvg: '' };
  }

  const trimmed = rawSvg.trim();

  // Basic check for <svg> element start
  if (!trimmed.toLowerCase().includes('<svg')) {
    return { cleanSvg: '', error: 'Invalid SVG format — missing <svg> root element' };
  }

  // Perform DOM-based parsing and sanitization if running in browser context
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(trimmed, 'image/svg+xml');

      // Check for parsing errors
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        return { cleanSvg: '', error: 'Malformed SVG XML syntax' };
      }

      const svgEl = doc.querySelector('svg');
      if (!svgEl) {
        return { cleanSvg: '', error: 'No <svg> root element found' };
      }

      // Security Pass 1: Remove dangerous tags
      const dangerousTags = ['script', 'foreignobject', 'iframe', 'object', 'embed', 'link', 'meta', 'applet'];
      dangerousTags.forEach((tag) => {
        const elements = doc.querySelectorAll(tag);
        elements.forEach((el) => el.remove());
      });

      // Security Pass 2: Remove dangerous attributes (on*, javascript:, data:text/html)
      const allElements = doc.querySelectorAll('*');
      allElements.forEach((el) => {
        const attributes = Array.from(el.attributes);
        attributes.forEach((attr) => {
          const nameLower = attr.name.toLowerCase();
          const valLower = attr.value.toLowerCase().replace(/\s+/g, '');

          // Strip inline event handlers
          if (nameLower.startsWith('on')) {
            el.removeAttribute(attr.name);
          }

          // Strip dangerous links
          if (
            (nameLower === 'href' || nameLower === 'xlink:href' || nameLower === 'src' || nameLower === 'action') &&
            (valLower.startsWith('javascript:') || valLower.startsWith('data:text/html'))
          ) {
            el.removeAttribute(attr.name);
          }
        });
      });

      // Responsive & ViewBox Fit Pass
      const existingViewBox = svgEl.getAttribute('viewBox');
      const widthAttr = svgEl.getAttribute('width');
      const heightAttr = svgEl.getAttribute('height');

      if (!existingViewBox && widthAttr && heightAttr) {
        const w = parseFloat(widthAttr.replace(/px/gi, ''));
        const h = parseFloat(heightAttr.replace(/px/gi, ''));
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
          svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
        }
      }

      svgEl.setAttribute('width', '100%');
      svgEl.setAttribute('height', 'auto');
      svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svgEl.classList.add('w-full', 'h-auto', 'max-w-full', 'inline-block', 'vector-svg');

      const serializer = new XMLSerializer();
      return { cleanSvg: serializer.serializeToString(svgEl) };
    } catch (e) {
      console.warn('[SvgRenderer] Failed to parse SVG with DOMParser:', e);
      return { cleanSvg: '', error: 'Failed to process SVG vector graphics' };
    }
  }

  // Fallback for SSR or non-DOM environment
  const sanitized = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(['"])(.*?)\1/gi, '')
    .replace(/href\s*=\s*(['"])javascript:(.*?)\1/gi, '');

  return { cleanSvg: sanitized };
}

export function SvgRenderer({ svgCode, className, maxHeight = 'max-h-72', altText }: SvgRendererProps) {
  const { cleanSvg, error } = useMemo(() => {
    return sanitizeAndFormatSvg(svgCode || '');
  }, [svgCode]);

  if (!svgCode || !svgCode.trim()) return null;

  if (error) {
    return (
      <div className={cn('p-3 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs flex items-center space-x-2 my-2', className)}>
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'my-2 flex items-center justify-center overflow-hidden rounded-md border bg-background/50 p-2 text-slate-900 dark:text-slate-100 shadow-sm [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto',
        maxHeight,
        className
      )}
      role="img"
      aria-label={altText || 'Vector Diagram'}
      dangerouslySetInnerHTML={{ __html: cleanSvg }}
    />
  );
}
