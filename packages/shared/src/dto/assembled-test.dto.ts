export interface AllocatedQuestionDto {
  questionId: string;
  questionHash: string;
  conceptKey: string;
  difficultyLevel: string;
  questionType: string;
  questionOrder: number;
  questionSnapshot: unknown;
}

export interface AllocatedSectionDto {
  sectionKey: string;
  displayName: string;
  durationSeconds: number;
  questionCount: number;
  orderIndex: number;
  questions: AllocatedQuestionDto[];
}

export interface AssembledTestDto {
  testInstanceId: string;
  testConfigId: string;
  userId: string;
  status: string;
  totalDurationSeconds: number;
  sections: AllocatedSectionDto[];
}
