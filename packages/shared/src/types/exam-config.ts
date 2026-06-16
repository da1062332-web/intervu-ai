export interface ExamConfigEntity {
  id: string;
  name: string;
  role: string;
  durationMinutes: number;
  totalQuestions: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
