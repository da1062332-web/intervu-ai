import { DifficultyLevel } from '@prisma/client';

export interface BlueprintSectionDto {
  sectionKey: string;
  displayName: string;
  durationSeconds: number;
  questionCount: number;
  orderIndex: number;
}

export interface BlueprintDto {
  testConfigId: string;
  totalQuestions: number;
  totalDurationSeconds: number;
  sections: BlueprintSectionDto[];
}
