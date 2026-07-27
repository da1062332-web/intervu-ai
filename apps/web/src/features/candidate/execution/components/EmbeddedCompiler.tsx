'use client';

import { useEffect, useRef } from 'react';

interface EmbeddedCompilerProps {
  onChange?: (data: any) => void;
  initialData?: any;
}

// SEC-003: Trusted origins for the embedded compiler
const TRUSTED_COMPILER_ORIGIN = 'https://onecompiler.com';

// SEC-003: Expected message types from OneCompiler
const VALID_MESSAGE_TYPES = new Set([
  'codeChange',
  'languageChange',
  'run',
  'output',
  'error',
]);

/**
 * SEC-003: Validate a message received from the embedded compiler iframe.
 * Returns the validated data or null if the message should be rejected.
 */
function validateCompilerMessage(event: MessageEvent): any | null {
  // 1. Validate origin — reject anything not from the trusted compiler domain
  if (event.origin !== TRUSTED_COMPILER_ORIGIN) {
    return null; // Silently reject — could be ads, other iframes, or malicious origin
  }

  // 2. Validate that the message has expected structure
  if (!event.data || typeof event.data !== 'object') {
    return null;
  }

  const data = event.data;

  // 3. Validate message type (OneCompiler sends a `type` or identifiable field)
  //    OneCompiler typically sends objects with a `language` field for code change events
  //    and `type` for other events. Accept both patterns.
  const hasLanguage = typeof data.language === 'string' && data.language.length > 0;
  const hasValidType = typeof data.type === 'string' && VALID_MESSAGE_TYPES.has(data.type);

  if (!hasLanguage && !hasValidType) {
    return null;
  }

  // 4. Validate payload fields — no XSS vectors via injected strings beyond reasonable length
  if (data.code && typeof data.code !== 'string') {
    return null;
  }
  if (data.language && data.language.length > 100) {
    return null;
  }

  return data;
}

export function EmbeddedCompiler({ onChange, initialData }: EmbeddedCompilerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // SEC-003: Validate origin and payload before processing
      const validatedData = validateCompilerMessage(event);
      if (!validatedData) {
        // Reject untrusted or malformed messages without logging sensitive info
        return;
      }

      if (onChange) {
        onChange(validatedData);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onChange]);

  // Construct the embed URL with all the requested query parameters
  const baseUrl = 'https://onecompiler.com/embed';
  const queryParams = new URLSearchParams({
    theme: 'dark',
    fontSize: '12',
    listenToEvents: 'true',
    codeChangeEvent: 'true',
    language: 'python',
    // NOTE: do NOT include `languages` param — it restricts the language dropdown.
    // Omitting it allows the candidate to pick any language.
  });

  // If there is initial code, use it. Otherwise, pass a space to override previous cached code
  if (initialData?.code) {
    queryParams.set('code', initialData.code);
    if (initialData.language) {
      queryParams.set('language', initialData.language);
    }
  } else {
    queryParams.set('code', '\n');
  }

  return (
    <div className='w-full h-full min-h-[700px] flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-border/50'>
      <div className='bg-muted/30 px-4 py-3 border-b flex items-center justify-between'>
        <span className='font-semibold text-sm'>Coding Environment</span>
        <span className='text-xs text-muted-foreground'>Powered by OneCompiler</span>
      </div>
      <div className='flex-1 relative w-full h-full min-h-[650px]'>
        <iframe
          ref={iframeRef}
          id="oc-editor"
          src={`${baseUrl}?${queryParams.toString()}`}
          width='100%'
          height='100%'
          frameBorder='0'
          title='OneCompiler'
          className='absolute inset-0'
          sandbox='allow-scripts allow-same-origin allow-popups allow-forms'
          style={{
            border: 'none',
            overflow: 'hidden',
          }}
        />
      </div>
    </div>
  );
}
