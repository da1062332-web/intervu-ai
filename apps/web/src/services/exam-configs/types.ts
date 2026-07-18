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
  totalTopics: number;
  totalTemplates: number;
  totalManualQuestions?: number;
  conceptCodes: string[];
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

export interface ReadinessCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message?: string;
}

export interface ReadinessFix {
  link: string;
  type: string;
  message: string;
}

export interface ConfigReadinessResponse {
  score: number;
  status: 'READY' | 'PARTIALLY_READY' | 'NOT_READY';
  checks: ReadinessCheck[];
  report?: {
    fixes?: ReadinessFix[];
    layerBreakdown?: Record<string, string>;
  };
}
