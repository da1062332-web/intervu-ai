'use client';

import React from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { ExecutionLayout } from './ExecutionLayout';
import { StreamlinedSandboxLayout } from './StreamlinedSandboxLayout';
import { TerminalSandboxLayout } from './TerminalSandboxLayout';
import { ConnectionStatus } from './ConnectionStatus';

export interface SandboxRendererProps {
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

export function SandboxRenderer(props: SandboxRendererProps = {}) {
  const testInstance = useExecutionStore((s) => s.testInstance);
  
  // Safe fallback to 'DEFAULT'
  const uiType = testInstance?.sandboxUi || 'DEFAULT';

  const renderLayout = () => {
    switch (uiType) {
      case 'SANDBOX_2':
        return <StreamlinedSandboxLayout {...props} />;
      case 'SANDBOX_3':
        return <TerminalSandboxLayout {...props} />;
      case 'DEFAULT':
      default:
        return <ExecutionLayout />;
    }
  };

  return (
    <>
      <ConnectionStatus />
      {renderLayout()}
    </>
  );
}
