'use client';

import React from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { ExecutionLayout } from './ExecutionLayout';
import { StreamlinedSandboxLayout } from './StreamlinedSandboxLayout';
import { TerminalSandboxLayout } from './TerminalSandboxLayout';

export interface SandboxRendererProps {
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

export function SandboxRenderer(props: SandboxRendererProps = {}) {
  const testInstance = useExecutionStore((s) => s.testInstance);
  
  // Safe fallback to 'DEFAULT'
  const uiType = testInstance?.sandboxUi || 'DEFAULT';

  switch (uiType) {
    case 'SANDBOX_2':
      return <StreamlinedSandboxLayout {...props} />;
    case 'SANDBOX_3':
      return <TerminalSandboxLayout {...props} />;
    case 'DEFAULT':
    default:
      return <ExecutionLayout />;
  }
}
