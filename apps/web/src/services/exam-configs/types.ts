export interface ExamConfig {
  id: string;
  name: string;
  code: string;
  role: string;
  durationMinutes: number;
  totalQuestions: number;
  isActive: boolean;
  status?: string;
  createdAt: string;
}

export type CreateConfigPayload = Omit<ExamConfig, 'id' | 'isActive' | 'createdAt' | 'status'>;
export type UpdateConfigPayload = Partial<CreateConfigPayload> & { isActive?: boolean; status?: string };
