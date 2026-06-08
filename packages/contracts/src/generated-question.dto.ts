export interface GeneratedQuestionDto {
  questionId: string;
  templateId: string;
  conceptKey: string;
  difficultyLevel: "easy" | "medium" | "hard";
  questionType: "mcq" | "numeric" | "coding";
  questionText: string;
  options?: string[];
  correctAnswer: string;
  solution: string;
  metadata: Record<string, unknown>;
}
