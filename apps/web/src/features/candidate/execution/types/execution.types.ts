export type QuestionStatus = 'ANSWERED' | 'UNANSWERED' | 'CURRENT' | 'MARKED_FOR_REVIEW';
export type QuestionType = 'MCQ' | 'MSQ' | 'NUMERIC' | 'CODING';

export type AutosaveStatus = 'IDLE' | 'SAVING' | 'SAVED' | 'FAILED';
export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'RECONNECTING';
export type SubmissionStatus = 'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'FAILED';
export type SectionStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'LOCKED';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  questionTitle?: string;
  instructions?: any;
  questionSnapshot?: any;
  codingData?: any;
  id: string;
  questionHash: string;
  type: QuestionType;
  text: string;
  options: QuestionOption[];
  orderIndex: number;
  stem?: string;
  candidateInstructions?: string;
}

export interface Section {
  sectionName?: string;
  id: string;
  sectionKey: string;
  title: string;
  questions: Question[];
  /** Duration for this section in seconds (used when sectionTimingEnabled = true) */
  durationSeconds?: number;
  /** Server-authoritative ISO timestamp of when this section was activated */
  startedAt?: string | null;
  /** Current lifecycle status of this section */
  status?: SectionStatus;
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
  /** Whether per-section timers are enforced */
  sectionTimingEnabled?: boolean;
  /** Index of the currently active section from the server */
  currentSectionIndex?: number;
  /** Index of the currently active question overall from the server */
  currentQuestionIndex?: number;
  /** Server timestamp (ISO string) — used for clock-sync on section timers */
  serverTime?: string;
  sandboxUi?: string;
}
