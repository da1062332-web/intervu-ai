import { z } from "zod";

export const GeneratedQuestionSchema = z.object({
  questionId: z.string().min(1, "questionId is required"),
  templateId: z.string().min(1, "templateId is required"),
  conceptKey: z.string().min(1, "conceptKey is required"),
  difficultyLevel: z.enum(["easy", "medium", "hard"]),
  questionType: z.enum(["mcq", "numeric", "coding"]),
  questionText: z.string().min(10, "questionText must be at least 10 characters long"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1, "correctAnswer is required"),
  solution: z.string().min(1, "solution is required"),
  metadata: z.record(z.unknown()),
}).superRefine((data, ctx) => {
  if (data.questionType === "mcq") {
    if (!data.options) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "options array is required for MCQ questionType",
      });
    } else if (data.options.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "options must have at least 2 elements for MCQ questionType",
      });
    }
  }
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;
