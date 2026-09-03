import { SandboxUIType } from "./schemas/exam-config.schema";

export interface CreateExamConfig {
  name: string;
  code: string;
  role: string;
  description?: string | null;
  durationMinutes: number;
  totalQuestions: number;
  sandboxUi?: SandboxUIType | keyof typeof SandboxUIType;
}

export interface UpdateExamConfig {
  name?: string;
  code?: string;
  role?: string;
  description?: string | null;
  durationMinutes?: number;
  totalQuestions?: number;
  sandboxUi?: SandboxUIType | keyof typeof SandboxUIType;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED" | "VALIDATED" | "PUBLISHED";
  isArchived?: boolean;
}

export interface ExamConfigDto extends CreateExamConfig {
  id: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "VALIDATED" | "PUBLISHED";
  isArchived: boolean;
  sandboxUi?: SandboxUIType | keyof typeof SandboxUIType;
  createdBy: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}
