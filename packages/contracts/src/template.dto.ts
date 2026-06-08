export interface TemplateDto {
  id: string;
  templateKey: string;
  conceptKey: string;
  difficultyLevel: "easy" | "medium" | "hard";
  questionType: "mcq" | "numeric" | "coding";
  structure: Record<string, unknown>;
  variableSchema: Record<string, unknown>;
  constraints: Record<string, unknown>;
  version: number;
}
