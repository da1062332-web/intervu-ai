export interface ExamConfig {
  id: string;
  name: string;
  role: string;
  durationMinutes: number;
  totalQuestions: number;
  isActive: boolean;
  createdAt: string;
}

export type CreateConfigPayload = Omit<ExamConfig, 'id' | 'isActive' | 'createdAt'>;
export type UpdateConfigPayload = Partial<CreateConfigPayload> & { isActive?: boolean };
