import { z } from "zod";

export const CandidateQuestionSchema = z.object({
  questionId: z.string().min(1, "questionId is required"),
  conceptKey: z.string().min(1, "conceptKey is required"),
  difficultyLevel: z.enum(["easy", "medium", "hard"]),
  questionType: z.enum(["mcq", "numeric", "coding"]),
  questionText: z.string().min(10, "questionText must be at least 10 characters long"),
  options: z.array(z.string()).optional(),
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

export type CandidateQuestion = z.infer<typeof CandidateQuestionSchema>;
