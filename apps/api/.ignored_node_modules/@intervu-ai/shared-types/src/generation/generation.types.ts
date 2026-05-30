import { DifficultyLevel } from '../enums/difficulty.enums';

export interface GeneratedQuestion {
  questionId: string;

  templateId: string;

  concept: string;

  difficulty: DifficultyLevel;

  question: string;

  options: string[];

  correctAnswer: string;

  solution: string;

  metadata: Record<string, unknown>;
}