export interface CreateExamConfig {
  name: string;
  code: string;
  role: string;
  description?: string | null;
  durationMinutes: number;
  totalQuestions: number;
}

export interface UpdateExamConfig {
  name?: string;
  code?: string;
  role?: string;
  description?: string | null;
  durationMinutes?: number;
  totalQuestions?: number;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isArchived?: boolean;
}

export interface ExamConfigDto extends CreateExamConfig {
  id: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isArchived: boolean;
  createdBy: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}
