export interface ExamSection {
  id: string;
  name: string;
  questionCount: number;
  durationMinutes: number;
  displayOrder: number;
}

export interface CreateSectionPayload {
  name: string;
  questionCount: number;
  durationMinutes: number;
  displayOrder: number;
}

export interface UpdateSectionPayload {
  name?: string;
  questionCount?: number;
  durationMinutes?: number;
  displayOrder?: number;
}
