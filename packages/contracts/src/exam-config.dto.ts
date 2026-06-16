export interface CreateExamConfig {
  name: string;
  role: string;
  durationMinutes: number;
  totalQuestions: number;
}

export interface UpdateExamConfig {
  name?: string;
  role?: string;
  durationMinutes?: number;
  totalQuestions?: number;
}

export interface ExamConfigDto extends CreateExamConfig {
  id: string;
  createdBy: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}
