export interface CreateExamSection {
  name: string;
  questionCount: number;
  durationMinutes?: number | null;
  displayOrder: number;
}

export interface UpdateExamSection {
  name?: string;
  questionCount?: number;
  durationMinutes?: number | null;
  displayOrder?: number;
}

export interface ExamSectionDto extends CreateExamSection {
  id: string;
  examConfigId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
