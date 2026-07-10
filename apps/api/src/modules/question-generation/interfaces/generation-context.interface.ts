import { GenerationStrategy } from "@prisma/client";

// ─── Per-strategy payload shapes ─────────────────────────────────────────────

export interface VariablePayload {
  variables: Record<string, unknown>;
  derivedVariables: Record<string, unknown>;
  hydratedQuestion?: string;
}

export interface DatasetPayload {
  passage: string;
  datasetMetadata: {
    datasetId: string;
    itemId: string;
    topic: string;
    difficulty: string;
    tags: string[];
  };
}

export interface HybridPayload {
  relationshipGraph: Record<string, unknown>;
  scenario: {
    scenarioId: string;
    entitySchema: Record<string, unknown>;
    relationSchema: Record<string, unknown>;
  };
}

export type GenerationPayload = VariablePayload | DatasetPayload | HybridPayload;

// ─── Unified GenerationContext ────────────────────────────────────────────────

/**
 * Every strategy returns a GenerationContext.
 * Downstream services (PromptBuilder, Validator, Assembler) consume only this shape.
 */
export interface GenerationContext {
  /** The strategy that produced this context */
  strategy: GenerationStrategy;

  /** Strongly typed per-strategy payload */
  payload: GenerationPayload;

  /** Arbitrary metadata for tracing / logging / context summary */
  metadata: Record<string, unknown>;
}
