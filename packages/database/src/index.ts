export { prisma } from "./client";
export { connectPrisma, disconnectPrisma } from "./prisma.service";
export { EvaluationRepository } from "./repositories/evaluation.repository";
export type {
  CreateEvaluationInput,
  UpdateEvaluationInput,
} from "./repositories/evaluation.repository";

export { SkillScoreRepository } from "./repositories/skill-score.repository";
export type { CreateSkillScoreInput } from "./repositories/skill-score.repository";

// Day 1 & 2 Persistence
export * from "./repositories/test-config.repository";
export * from "./repositories/template.repository";
export * from "./repositories/generated-question.repository";
export * from "./repositories/test-instance.repository";
export * from "./repositories/question-pool.repository";
export * from "./repositories/test-instance-section.repository";
export * from "./repositories/test-instance-question.repository";
export * from "./repositories/assembly.repository";
export * from "./repositories/candidate-answer.repository";
export * from "./repositories/execution-state.repository";
export * from "./repositories/submission.repository";
export * from "./repositories/execution-persistence.repository";
export * from "./repositories/evaluation-result.repository";
export * from "./repositories/recommendation.repository";
export * from "./repositories/performance-summary.repository";
export * from "./repositories/exam-config.repository";
export * from "./repositories/exam-section.repository";
export * from "./repositories/concept-mapping.repository";
export * from "./utils/hash-question.util";

export * from "./types/database.types";

export {
  TestInstanceStatus,
  SubmissionStatus,
  RecommendationPriority,
} from "@prisma/client";

export type {
  GeneratedQuestion,
  DifficultyLevel,
  Template,
  Test,
  TestInstance,
  TestInstanceSection,
  TestInstanceQuestion,
  CandidateAnswer,
  ExecutionState,
  Submission,
  Recommendation,
  PerformanceSummary,
  Prisma,
  Concept,
} from "@prisma/client";
