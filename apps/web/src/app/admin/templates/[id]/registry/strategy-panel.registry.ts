'use client';

import type { ComponentType } from 'react';
import type { GenerationStrategy } from '@/services/question-generation/types';

export interface StrategyPanelProps {
  templateId: string;
  template?: any;
}

// Lazy-loaded strategy panels — avoids loading all panels on initial render
const strategyPanelRegistry: Record<
  GenerationStrategy,
  () => Promise<{ default: ComponentType<StrategyPanelProps> }>
> = {
  VARIABLE: () =>
    import('../components/strategy/VariableStrategyPanel').then((m) => ({
      default: m.VariableStrategyPanel,
    })),
  DATASET: () =>
    import('../components/strategy/DatasetStrategyPanel').then((m) => ({
      default: m.DatasetStrategyPanel,
    })),
  HYBRID: () =>
    import('../components/strategy/HybridStrategyPanel').then((m) => ({
      default: m.HybridStrategyPanel,
    })),
  MANUAL: () =>
    import('../components/strategy/ManualStrategyPanel').then((m) => ({
      default: m.ManualStrategyPanel,
    })),
};

/**
 * getStrategyPanelLoader
 *
 * Returns the dynamic import function for the given strategy.
 * StrategyConfigSection calls this and renders — zero switch/if.
 */
export function getStrategyPanelLoader(strategy: GenerationStrategy) {
  return strategyPanelRegistry[strategy] || strategyPanelRegistry.MANUAL;
}

export const STRATEGY_LABELS: Record<GenerationStrategy, string> = {
  VARIABLE: 'Variable',
  DATASET: 'Dataset',
  HYBRID: 'Hybrid',
  MANUAL: 'Manual',
};

export const STRATEGY_DESCRIPTIONS: Record<GenerationStrategy, string> = {
  VARIABLE: 'Generate questions using mathematical variables, formulas, and constraints.',
  DATASET: 'Generate reading comprehension questions from a dataset of passages.',
  HYBRID: 'Generate logical reasoning questions from entity-relationship scenarios.',
  MANUAL: 'Bind pre-authored static text or image-backed questions directly to assessment templates.',
};
