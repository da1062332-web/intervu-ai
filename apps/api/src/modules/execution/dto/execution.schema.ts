import { z } from "zod";

export const CandidateAnswerSchema = z.object({
  questionId: z.string().min(1, "Question ID is required"),
  answer: z.string().min(1, "Answer cannot be empty"),
  timeSpentSeconds: z.number().int().min(0).optional().default(0),
  isMarkedForReview: z.boolean().optional().default(false),
});

export const SubmitExecutionSchema = z.object({
  testId: z.string().min(1, "Test ID is required"),
});
