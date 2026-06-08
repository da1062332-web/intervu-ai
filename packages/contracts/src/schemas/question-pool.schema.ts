import { z } from "zod";
import { GeneratedQuestionSchema } from "./generated-question.schema";

export const QuestionPoolSchema = z.object({
  questions: z
    .array(GeneratedQuestionSchema)
    .min(1, "questions array cannot be empty"),
  total: z.number().int().min(1, "total must be at least 1"),
  generatedAt: z
    .string()
    .refine(
      (val) =>
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/.test(
          val,
        ),
      { message: "generatedAt must be a valid ISO timestamp" },
    ),
});

export type QuestionPool = z.infer<typeof QuestionPoolSchema>;
