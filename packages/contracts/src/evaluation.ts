import { z } from "zod";

export const CandidateAnswerSchema = z.object({
  questionId: z.string().min(1, "questionId is required"),
  answer: z.string(),
});

export type CandidateAnswer = z.infer<typeof CandidateAnswerSchema>;

export const ExecutionResultSchema = z.object({
  executionId: z.string().min(1, "executionId is required"),
  testId: z.string().min(1, "testId is required"),
  status: z.string().default("submitted"),
  answers: z.array(CandidateAnswerSchema),
  submittedAt: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date()),
});

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;

export const EvaluationResultDtoSchema = z.object({
  evaluationId: z.string().min(1, "evaluationId is required"),
  overallScore: z.number().min(0).max(100),
  confidenceScore: z.number().min(0).max(100),
  skillScores: z.record(z.string(), z.number().min(0).max(100)),
  feedback: z.array(z.string()),
  evaluatedAt: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date()),
});

export type EvaluationResultDto = z.infer<typeof EvaluationResultDtoSchema>;
