import type { ExamConfig } from '@/services/exam-configs/types';

// API DTOs (Mapped from @SkillitriX-ai/contracts if not fully available there)
export interface GeneratedQuestion {
  id: string;
  questionText: string;
  options?: string[];
  answer: string;
  explanation: string;
  difficulty: string;
  conceptKey: string;
  topicId?: string;
  sectionId?: string;
}

export interface AssessmentSection {
  id: string;
  name: string;
  questions: GeneratedQuestion[];
}

export interface Assessment {
  testId: string;
  title: string;
  companyId: string;
  examConfigId: string | null;
  status: string;
  sections?: AssessmentSection[];
  questions?: GeneratedQuestion[]; // flattened if sections aren't strictly nested
}

// UI Models
export interface BlueprintPreviewModel {
  config: ExamConfig;
  totalQuestions: number;
  durationMinutes: number;
}

export interface AssessmentSummary {
  assessmentId: string;
  title: string;
  totalQuestions: number;
  sectionsCount: number;
  status: string;
  createdAt: string;
}

// Validation Model
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}
