export { prisma } from "./client";
export { connectPrisma, disconnectPrisma } from "./prisma.service";
export {
  EvaluationRepository,
  type CreateEvaluationInput,
  type UpdateEvaluationInput,
} from "./repositories/evaluation.repository";
export {
  SkillScoreRepository,
  type CreateSkillScoreInput,
} from "./repositories/skill-score.repository";
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
export * from "./utils/hash-question.util";

export * from "./types/database.types";
export {
  type GeneratedQuestion,
  type DifficultyLevel,
  type Template,
  type Test,
  type TestInstance,
  type TestInstanceSection,
  type TestInstanceQuestion,
  TestInstanceStatus,
  type CandidateAnswer,
  type ExecutionState,
  type Submission,
  SubmissionStatus,
  type Recommendation,
  type PerformanceSummary,
  RecommendationPriority,
  type Prisma,
} from "@prisma/client";
