export interface CreateExamSection {
  name: string;
  code: string;
  questionCount: number;
  sectionDurationMinutes: number;
  sectionOrder: number;
  isRequired: boolean;
}

export interface UpdateExamSection {
  name?: string;
  code?: string;
  questionCount?: number;
  sectionDurationMinutes?: number;
  sectionOrder?: number;
  isRequired?: boolean;
}

export interface ExamSectionDto extends CreateExamSection {
  id: string;
  examConfigId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
