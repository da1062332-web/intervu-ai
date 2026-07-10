// ─── Strategy Types ────────────────────────────────────────────────────────
export type GenerationStrategy = 'VARIABLE' | 'DATASET' | 'HYBRID';

// ─── Request DTOs ──────────────────────────────────────────────────────────
export interface QuestionGenerationRequest {
  templateId: string;
  context?: Record<string, unknown>;
  options?: Record<string, unknown>;
}

export interface ValidateQuestionRequest extends QuestionGenerationRequest {
  question?: Record<string, unknown>;
}

// ─── Generation Context ────────────────────────────────────────────────────
export interface GenerationContext {
  strategy: GenerationStrategy;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

// ─── Validation ────────────────────────────────────────────────────────────
export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ─── Generated Question ────────────────────────────────────────────────────
export interface GeneratedQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  generationStrategy: GenerationStrategy;
  templateId: string;
  status: string;
  topicId?: string;
  conceptId?: string;
  metadata: Record<string, unknown>;
  resolvedVariables?: Record<string, unknown>;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Preview Result ────────────────────────────────────────────────────────
export interface QuestionPreviewResult {
  previewText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  context: GenerationContext;
}

// ─── Generate Response ─────────────────────────────────────────────────────
export interface GenerateQuestionResponse {
  question: GeneratedQuestion;
  generationStrategy: GenerationStrategy;
  validationReport: ValidationReport;
  contextSummary: string;
}

// ─── Validate Response ─────────────────────────────────────────────────────
export interface ValidateQuestionResponse {
  validationReport: ValidationReport;
  strategy: GenerationStrategy;
  templateId: string;
}

// Legacy types kept for backward compatibility
export type QuestionGenerationStatus = 'Draft' | 'Approved' | 'Rejected' | 'Published';
export type GenerationMethod = 'AI' | 'Formula' | 'Static' | 'Dynamic';

export interface GenerationHistoryEntry {
  id: string;
  templateId: string;
  batchSize: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  status: 'Completed' | 'Failed' | 'In Progress';
}
