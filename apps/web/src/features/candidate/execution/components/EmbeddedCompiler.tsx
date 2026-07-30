'use client';

import { useEffect, useRef } from 'react';

interface EmbeddedCompilerProps {
  onChange?: (data: any) => void;
  initialData?: any;
}

export function EmbeddedCompiler({ onChange }: EmbeddedCompilerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://onecompiler.com') return;
      if (event.data) {
        const payload = typeof event.data === 'object' ? event.data : { code: String(event.data) };
        if (onChangeRef.current) {
          onChangeRef.current(payload);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src="https://onecompiler.com/embed/?listenToEvents=true&codeChangeEvent=true"
      width="100%"
      height="550px"
      frameBorder="0"
    ></iframe>
  );
}
