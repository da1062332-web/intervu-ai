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
  sandboxUi?: string;
  currentVersionNumber?: number | null;
  activeVersionId?: string | null;
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

export interface ExamPublishedVersion {
  id: string;
  examConfigId: string;
  versionNumber: number;
  versionName: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED';
  versionHash: string;
  publishedBy?: string | null;
  publishedAt: string;
  changelogSummary?: string | null;
  configSnapshot: Record<string, any>;
  scoringRulesSnapshot: Record<string, any>;
  versionSections?: Array<{
    id: string;
    sectionCode: string;
    sectionName: string;
    sectionOrder: number;
    sectionDurationMinutes: number;
    questionCount: number;
    isRequired: boolean;
    topicDistributionJson: any;
  }>;
  _count?: {
    versionQuestions: number;
    testInstances: number;
  };
}

export interface PublishResult {
  configId: string;
  status: string;
  version: string;
  versionNumber?: number;
  publishedVersionId?: string;
  publishedAt: string;
  validation: ConfigValidationResult;
}

export interface ReadinessCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message?: string;
  details?: Record<string, any>;
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
