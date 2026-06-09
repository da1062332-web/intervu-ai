export interface CandidateQuestionDto {
  questionId: string;
  conceptKey: string;
  difficultyLevel: "easy" | "medium" | "hard";
  questionType: "mcq" | "numeric" | "coding";
  questionText: string;
  options?: string[];
}
