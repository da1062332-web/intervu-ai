import type { ExamBlueprint, StyleProfile, GenerationRequest } from '@intervu-ai/contracts';

export type { ExamBlueprint, StyleProfile, GenerationRequest };

export interface CompilationPreviewResponse {
  sections: Array<{
    sectionId: string;
    questionCount: number;
    allocations: Array<{
      topicId: string;
      topicName: string;
      total: number;
      byDifficulty: {
        EASY: number;
        MEDIUM: number;
        HARD: number;
      };
    }>;
  }>;
  requests: GenerationRequest[];
}

export interface CompilationHealthCheck {
  status: 'PASS' | 'FAIL';
  message?: string;
}

export interface CompilationHealthResponse {
  valid: boolean;
  checks: {
    templatesAvailable: CompilationHealthCheck;
    conceptsAvailable: CompilationHealthCheck;
    difficultyCoverage: CompilationHealthCheck;
    generationReady: CompilationHealthCheck;
  };
  errors: string[];
}

export interface CompileResponse {
  batchId: string;
  requestCount: number;
}

export interface BlueprintConfig {
  id: string;
  configId: string;
  name: string;
  code: string;
  description?: string;
  totalQuestions: number;
  totalDurationMinutes: number;
  isActive: boolean;
  styleProfileId?: string;
  styleProfileName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidationSummary {
  valid: boolean;
  totalConfiguredQuestions: number;
  totalExpectedQuestions: number;
  totalMissingQuestions: number;
  totalWeightage: number;
  errors: string[];
}

export type ValidationResult = ValidationSummary;
export type BlueprintPreviewData = any;

export interface BlueprintTopicDetail {
  topicName: string;
  sectionName: string;
  questionCount: number;
  weightage: number;
  difficultyDistribution: {
    easyCount: number;
    mediumCount: number;
    hardCount: number;
  };
}

export interface BlueprintDetail extends BlueprintConfig {
  valid: boolean;
  validationSummary: ValidationSummary;
  topics: BlueprintTopicDetail[];
}

export interface TopicAllocationPayload {
  topicId: string;
  percentage: number;
}

export interface DifficultyAllocationPayload {
  easy: number;
  medium: number;
  hard: number;
}

export interface BlueprintSectionPayload {
  sectionId: string;
  questionCount: number;
  topicAllocations: TopicAllocationPayload[];
  difficultyAllocation: DifficultyAllocationPayload;
  templateTypes: string[];
}

export interface CreateBlueprintPayload {
  configId: string;
  styleProfileId: string;
  sections: BlueprintSectionPayload[];
}

export type UpdateBlueprintPayload = Partial<CreateBlueprintPayload>;

export interface AddTopicConfigPayload {
  sectionId: string;
  topicId: string;
  questionCount: number;
  weightage: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
}
