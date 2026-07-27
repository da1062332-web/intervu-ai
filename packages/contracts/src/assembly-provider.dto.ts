export interface AssemblyProviderRequest {
  examId: string;
  sectionId: string;
  count: number;
  difficultyDistribution: {
    EASY?: number;
    MEDIUM?: number;
    HARD?: number;
  };
  topicIds?: string[];
}

export interface AssemblyProviderQuestion {
  id: string;
  questionText: string;
  answer: string;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topicId: string;
  sectionId: string;
  mcqData?: any;
  codingData?: any;
  metadata?: any;
  options?: any;
  questionStatement?: string | null;
  instructions?: string | null;
}

export interface AssemblyProviderResponse {
  questions: AssemblyProviderQuestion[];
  reservationIds: string[];
  assemblyId: string;
  expiresAt: string;
}

export interface QuestionAvailabilityDetails {
  difficulty: "EASY" | "MEDIUM" | "HARD";
  required: number;
  available: number;
  missing: number;
}

export interface QuestionAvailabilityResponse {
  status: "AVAILABLE" | "INSUFFICIENT_POOL";
  required: number;
  available: number;
  missing: number;
  details: QuestionAvailabilityDetails[];
}

export interface PoolHealthMetrics {
  totalActiveQuestions: number;
  reservedQuestions: number;
  expiredReservations: number;
  neverUsedQuestions: number;
  recentlyUsedQuestions: number;
  overusedQuestions: number;
  coverageByDifficulty: {
    EASY: number;
    MEDIUM: number;
    HARD: number;
  };
  coverageByTopic: Record<string, number>;
}
