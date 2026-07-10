'use client';

import React, { Suspense, lazy, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useStrategyConfigStore } from '@/store/strategy-config.store';
import { getStrategyPanelLoader, STRATEGY_LABELS, STRATEGY_DESCRIPTIONS } from '../registry/strategy-panel.registry';
import type { GenerationStrategy } from '@/services/question-generation/types';

function PanelFallback() {
  return (
    <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Loading strategy panel...</span>
    </div>
  );
}

/**
 * StrategyConfigSection
 *
 * Reads currentStrategy from Zustand and calls getStrategyPanelLoader(strategy)
 * from the registry — ZERO switch/if logic here.
 *
 * Adding a new strategy requires only:
 *   1. Create the panel component
 *   2. Register it in strategy-panel.registry.ts
 */
export function StrategyConfigSection() {
  const { id: templateId } = useParams() as { id: string };
  const { currentStrategy } = useStrategyConfigStore();

  // Obtain loader function from registry — no switch/if
  const loader = getStrategyPanelLoader(currentStrategy as GenerationStrategy);

  // Lazily import the panel using the loader from the registry
  const Panel = lazy(loader);

  return (
    <div className="space-y-2">
      {/* Strategy Header */}
      <div className="flex items-center gap-3 px-1 mb-4">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            {STRATEGY_LABELS[currentStrategy as GenerationStrategy]} Strategy
          </span>
          <p className="text-sm text-gray-500 mt-0.5">
            {STRATEGY_DESCRIPTIONS[currentStrategy as GenerationStrategy]}
          </p>
        </div>
      </div>

      {/* Panel rendered from registry — no switch/if */}
      <Suspense fallback={<PanelFallback />}>
        <Panel templateId={templateId} />
      </Suspense>
    </div>
  );
}
