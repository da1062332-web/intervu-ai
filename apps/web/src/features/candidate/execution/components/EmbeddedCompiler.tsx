'use client';

import { useEffect } from 'react';

interface EmbeddedCompilerProps {
  onChange?: (data: any) => void;
}

export function EmbeddedCompiler({ onChange }: EmbeddedCompilerProps) {
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.language) {
        console.log('[OneCompiler]', e.data);
        if (onChange) {
          onChange(e.data);
        }
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
    disableCopyPaste: 'true',
    listenToEvents: 'true',
    codeChangeEvent: 'true',
  });

  return (
    <div className='w-full h-full min-h-[700px] flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-border/50'>
      <div className='bg-muted/30 px-4 py-3 border-b flex items-center justify-between'>
        <span className='font-semibold text-sm'>Coding Environment</span>
        <span className='text-xs text-muted-foreground'>Powered by OneCompiler</span>
      </div>
      <div className='flex-1 relative w-full h-full min-h-[650px]'>
        <iframe
          id="oc-editor"
          src={`${baseUrl}?${queryParams.toString()}`}
          width='100%'
          height='100%'
          frameBorder='0'
          title='OneCompiler'
          className='absolute inset-0'
          style={{
            border: 'none',
            overflow: 'hidden',
          }}
        />
      </div>
    </div>
  );
}
