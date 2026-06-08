import { z } from "zod";

export const TemplateSchema = z.object({
  id: z.string().min(1, "id is required"),
  templateKey: z.string().min(1, "templateKey is required"),
  conceptKey: z.string().min(1, "conceptKey is required"),
  difficultyLevel: z.enum(["easy", "medium", "hard"]),
  questionType: z.enum(["mcq", "numeric", "coding"]),
  structure: z.record(z.unknown()),
  variableSchema: z.record(z.unknown()),
  constraints: z.record(z.unknown()),
  version: z.number().int().gt(0, "version must be greater than 0"),
});

export type Template = z.infer<typeof TemplateSchema>;
