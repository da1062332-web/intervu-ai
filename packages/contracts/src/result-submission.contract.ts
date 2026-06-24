export interface SessionDto {
  sessionId: string;
  testId: string;
  startedAt: string;
  expiresAt: string;
  currentSection: string;
  currentQuestion: number;
  status: "CREATED" | "ACTIVE" | "PAUSED" | "SUBMITTED" | "EXPIRED";
}

export interface AnswerDto {
  questionId: string;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
  textResponse?: string;
  status: "ANSWERED" | "UNANSWERED" | "CURRENT" | "MARKED_FOR_REVIEW";
  timeSpentSeconds: number;
}

export interface CandidateSubmissionDto {
  testId: string;
  sessionId: string;
  userId: string;
  answers: AnswerDto[];
  totalTimeSpentSeconds: number;
  submittedAt: string;
  tabSwitchCount: number;
  isAutoSubmitted: boolean;
}
