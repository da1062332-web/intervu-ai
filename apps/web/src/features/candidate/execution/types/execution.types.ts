export type QuestionStatus = 'ANSWERED' | 'UNANSWERED' | 'CURRENT';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  questionHash: string;
  text: string;
  options: QuestionOption[];
  orderIndex: number;
}

export interface Section {
  id: string;
  sectionKey: string;
  title: string;
  questions: Question[];
}

export interface AnswerState {
  questionId: string;
  selectedOptionId?: string;
  status: QuestionStatus;
}

export interface TestInstance {
  id: string;
  testConfigId: string;
  userId: string;
  assessmentName: string;
  candidateName: string;
  status: 'CREATED' | 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED';
  durationSeconds: number;
  sections: Section[];
}
