import type { ExamBlueprint, StyleProfile } from "@intervu-ai/contracts";

export type { ExamBlueprint, StyleProfile };

export interface CreateBlueprintPayload {
  configId: string;
  styleProfileId: string;
  sections: any[];
}

export interface UpdateBlueprintPayload {
  styleProfileId?: string;
  sections?: any[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface BlueprintPreviewData {
  blueprintId: string;
  configId: string;
  styleProfileId: string;
  sections: Array<{
    sectionId: string;
    questionCount: number;
    topics: Array<{
      topicId: string;
      percentage: number;
      expectedQuestions: number;
    }>;
    difficultyAllocation: {
      easy: number;
      medium: number;
      hard: number;
    };
  }>;
}
