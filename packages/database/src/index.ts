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
export * from "./utils/hash-question.util";
export * from "./types/database.types";
export type {
  GeneratedQuestion,
  DifficultyLevel,
  Template,
  Test,
  TestInstance,
  TestInstanceSection,
  TestInstanceQuestion,
  TestInstanceStatus,
  Prisma,
} from "@prisma/client";
