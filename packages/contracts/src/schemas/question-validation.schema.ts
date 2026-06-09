import { z } from "zod";

export const QuestionValidationSchema = z.object({
  questionId: z.string().min(1, "questionId is required"),
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  validatedAt: z
    .string()
    .refine(
      (val) =>
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/.test(
          val,
        ),
      { message: "validatedAt must be a valid ISO timestamp" },
    ),
});

export type QuestionValidation = z.infer<typeof QuestionValidationSchema>;
