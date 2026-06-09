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
export { TemplateRepository } from "./repositories/template.repository";
export { GeneratedQuestionRepository } from "./repositories/generated-question.repository";
export { TestConfigRepository } from "./repositories/test-config.repository";
export { TestInstanceRepository } from "./repositories/test-instance.repository";

