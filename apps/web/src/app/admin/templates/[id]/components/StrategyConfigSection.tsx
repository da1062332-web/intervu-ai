'use client';

import React, { Suspense, lazy } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useStrategyConfigStore } from '@/store/strategy-config.store';
import {
  getStrategyPanelLoader,
  STRATEGY_LABELS,
  STRATEGY_DESCRIPTIONS,
  type StrategyPanelProps,
} from '../registry/strategy-panel.registry';
import type { GenerationStrategy } from '@/services/question-generation/types';

function PanelFallback() {
  return (
    <div className='flex items-center justify-center py-16 text-gray-500 gap-2'>
      <Loader2 className='w-5 h-5 animate-spin' />
      <span className='text-sm'>Loading strategy panel...</span>
    </div>
  );
}

const panelCache = new Map<
  GenerationStrategy,
  React.LazyExoticComponent<React.ComponentType<StrategyPanelProps>>
>();

function getLazyPanel(strategy: GenerationStrategy) {
  if (!panelCache.has(strategy)) {
    const loader = getStrategyPanelLoader(strategy);
    panelCache.set(strategy, lazy(loader));
  }
  return panelCache.get(strategy)!;
}

interface StrategyConfigSectionProps {
  template?: any;
}

export function StrategyConfigSection({ template }: StrategyConfigSectionProps) {
  const { id: templateId } = useParams() as { id: string };
  const { currentStrategy } = useStrategyConfigStore();

  const strategyKey = (currentStrategy || template?.generationStrategy || 'VARIABLE') as GenerationStrategy;
  const Panel = getLazyPanel(strategyKey);

  return (
    <div className='space-y-2'>
      {/* Strategy Header */}
      <div className='flex items-center gap-3 px-1 mb-4'>
        <div className='flex flex-col'>
          <span className='text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400'>
            {STRATEGY_LABELS[strategyKey] || strategyKey} Strategy
          </span>
          <p className='text-sm text-gray-500 mt-0.5'>
            {STRATEGY_DESCRIPTIONS[strategyKey] || ''}
          </p>
        </div>
      </div>

      {/* Panel rendered from registry — no switch/if */}
      <Suspense fallback={<PanelFallback />}>
        <Panel templateId={templateId} template={template} />
      </Suspense>
    </div>
  );
}
