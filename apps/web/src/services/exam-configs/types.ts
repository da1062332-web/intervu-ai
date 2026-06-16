export interface ExamConfig {
  id: string;
  name: string;
  role: string;
  durationMinutes: number;
  totalQuestions: number;
  status: string;
  createdAt: string;
}

export type CreateConfigPayload = Omit<ExamConfig, 'id' | 'status' | 'createdAt'>;
export type UpdateConfigPayload = Partial<CreateConfigPayload>;
