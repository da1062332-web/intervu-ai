import type { ExamBlueprint, StyleProfile } from '@intervu-ai/contracts';

export type { ExamBlueprint, StyleProfile };

export interface BlueprintConfig {
  id: string;
  name: string;
  code: string;
  description?: string;
  totalQuestions: number;
  totalDurationMinutes: number;
  isActive: boolean;
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
  styleProfileId?: string;
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
  name?: string;
  code?: string;
  description?: string;
  totalQuestions?: number;
  totalDurationMinutes?: number;
  configId?: string;
  styleProfileId?: string;
  sections?: BlueprintSectionPayload[];
  isActive?: boolean;
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
