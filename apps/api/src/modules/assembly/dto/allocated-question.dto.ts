import { DifficultyLevel, Prisma } from "@prisma/client";

export interface AllocatedQuestionDto {
  questionId: string; // Refers to GeneratedQuestion id
  questionHash: string;
  conceptKey: string;
  difficultyLevel: DifficultyLevel;
  questionType: string;
  questionOrder: number;
  questionSnapshot: Prisma.InputJsonValue;
}
