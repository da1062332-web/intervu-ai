import { DifficultyLevel } from "@prisma/client";

export interface GenerationRequest {
  conceptKey: string;
  difficultyLevel: DifficultyLevel | "easy" | "medium" | "hard";
  questionType: "mcq" | "numeric" | "coding" | "MULTIPLE_CHOICE";
}

export interface HydratedSolution {
  steps: string[];
  finalAnswer: string;
}

export interface GenerationResult {
  questionText: string;
  options: string[];
  correctAnswer: string;
  solution: HydratedSolution;
  difficultyLevel: "easy" | "medium" | "hard";
  conceptKey: string;
  hash: string;
  parameters: Record<string, unknown>;
}
