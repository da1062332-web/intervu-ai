/**
 * Execution-Ready Contracts for Module 4 (Execution Engine)
 *
 * Module 4 ONLY depends on these contracts.
 * The AssembledTest entity is NEVER exposed directly to Module 4.
 */

/**
 * A single question ready for candidate execution.
 * All fields required by the execution engine are guaranteed present.
 */
export interface ExecutionQuestionDto {
  /** Canonical question ID from the Question Bank */
  questionId: string;
  /** Display order within the section (1-indexed) */
  questionOrder: number;
  /** Full question text shown to candidate */
  questionText: string;
  /** Question type: "MULTIPLE_CHOICE" | "SUBJECTIVE" | "CODING" etc. */
  questionType: string;
  /** Difficulty tier: "EASY" | "MEDIUM" | "HARD" */
  difficulty: string;
  /** Topic/concept this question belongs to */
  topicId: string;
  /** Multiple-choice options if applicable */
  options?: unknown;
  /** Correct answer (used by evaluation engine, not exposed to candidate) */
  answer?: unknown;
  /** Explanation shown post-evaluation */
  explanation?: unknown;
  /** Full raw snapshot for any additional metadata */
  snapshot?: unknown;
}

/**
 * A section within the execution-ready test package.
 */
export interface ExecutionSectionDto {
  /** Unique section key (e.g. "APTITUDE_001") */
  sectionKey: string;
  /** Human-readable section name */
  displayName: string;
  /** Allowed time in seconds for this section */
  durationSeconds: number;
  /** Number of questions in this section */
  questionCount: number;
  /** Order of this section in the test (0-indexed) */
  orderIndex: number;
  /** Ordered list of questions */
  questions: ExecutionQuestionDto[];
}

/**
 * Scoring rules derived from ExamConfig.RuleFlags.
 * Execution engine uses these to enforce test behaviour.
 */
export interface ExecutionScoringRules {
  /** Whether wrong answers deduct marks */
  negativeMarkingEnabled: boolean;
  /** Whether candidates can navigate between sections */
  sectionLockingEnabled: boolean;
  /** Whether question order is randomized per candidate */
  shuffleQuestionsEnabled: boolean;
  /** Whether option order is randomized per candidate */
  shuffleOptionsEnabled: boolean;
  /** Whether candidates can navigate between questions in a section */
  allowNavigation: boolean;
}

/**
 * Complete execution-ready test package.
 * This is the single handoff contract from Module 3 → Module 4.
 *
 * Module 4 must only depend on this contract.
 * Never depend on AssembledTest, TestInstance, or internal assembly types.
 */
export interface ExecutionReadyTestDto {
  metadata?: Record<string, unknown>;
  /** ID of the AssembledTest record this package was derived from */
  assemblyId: string;
  /** ExamConfig ID that defines this test's structure */
  configId: string;
  /** Total exam duration in seconds (sum of all section durations) */
  totalDurationSeconds: number;
  /** Total number of questions across all sections */
  totalQuestions: number;
  /** Optional candidate-facing instructions */
  instructions?: string;
  /** Scoring and behaviour rules */
  scoringRules: ExecutionScoringRules;
  /** Sections in display order */
  sections: ExecutionSectionDto[];
  /** ISO timestamp when this package was generated */
  packagedAt: string;
  /** Assembly status at time of packaging */
  assemblyStatus: string;
}
