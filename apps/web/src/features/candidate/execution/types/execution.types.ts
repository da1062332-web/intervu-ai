export type QuestionStatus = 'ANSWERED' | 'UNANSWERED' | 'CURRENT' | 'MARKED_FOR_REVIEW';
export type QuestionType = 'MCQ' | 'MSQ' | 'NUMERIC' | 'CODING';

export type AutosaveStatus = 'IDLE' | 'SAVING' | 'SAVED' | 'FAILED';
export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'RECONNECTING';
export type SubmissionStatus = 'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'FAILED';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  questionHash: string;
  type: QuestionType;
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
  selectedOptionId?: string; // For MCQ
  selectedOptionIds?: string[]; // For MSQ
  textResponse?: string; // For NUMERIC / CODING
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
