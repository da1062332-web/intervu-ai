export interface ExamConfig {
  id: string;
  name: string;
  code: string;
  role: string;
  durationMinutes: number;
  totalQuestions: number;
  isActive: boolean;
  isArchived?: boolean;
  status?: 'DRAFT' | 'VALIDATED' | 'ACTIVE' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt?: string;
}

export type CreateConfigPayload = Omit<
  ExamConfig,
  'id' | 'isActive' | 'isArchived' | 'createdAt' | 'updatedAt' | 'status'
>;
export type UpdateConfigPayload = Partial<CreateConfigPayload> & {
  isActive?: boolean;
  status?: string;
};

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  dependencyCheck?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface ConfigPreviewResponse {
  configId: string;
  name: string;
  role: string;
  durationMinutes: number;
  sections: number;
  questions: number;
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  sectionBreakdown: Array<{
    name: string;
    code: string;
    questionCount: number;
    durationMinutes: number;
    topicCount: number;
  }>;
  isReadyToPublish: boolean;
}

export interface ConfigVersionEntry {
  id: string;
  configId: string;
  versionNumber: number;
  snapshot: Record<string, unknown>;
  createdAt: string;
}

export interface PublishResult {
  configId: string;
  status: string;
  version: string;
  publishedAt: string;
  validation: ConfigValidationResult;
}
