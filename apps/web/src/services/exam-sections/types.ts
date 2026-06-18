export interface ExamSection {
  id: string;
  name: string;
  code: string;
  questionCount: number;
  sectionDurationMinutes: number;
  sectionOrder: number;
  isRequired: boolean;
}

export interface CreateSectionPayload {
  name: string;
  code: string;
  questionCount: number;
  sectionDurationMinutes: number;
  sectionOrder: number;
  isRequired: boolean;
}

export interface UpdateSectionPayload {
  name?: string;
  code?: string;
  questionCount?: number;
  sectionDurationMinutes?: number;
  sectionOrder?: number;
  isRequired?: boolean;
}
