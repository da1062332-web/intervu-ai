import { z } from "zod";

export const AssemblyProviderRequestSchema = z
  .object({
    examId: z.string().min(1, "examId is required"),
    sectionId: z.string().min(1, "sectionId is required"),
    count: z.number().int().positive("count must be positive"),
    difficultyDistribution: z.object({
      EASY: z.number().int().nonnegative().optional(),
      MEDIUM: z.number().int().nonnegative().optional(),
      HARD: z.number().int().nonnegative().optional(),
    }),
    topicIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      const easy = data.difficultyDistribution.EASY ?? 0;
      const medium = data.difficultyDistribution.MEDIUM ?? 0;
      const hard = data.difficultyDistribution.HARD ?? 0;
      return easy + medium + hard === data.count;
    },
    {
      message:
        "The sum of difficulty distribution counts does not match the requested total question count.",
      path: ["difficultyDistribution"],
    },
  );

export const AssemblyProviderQuestionSchema = z.object({
  id: z.string(),
  questionText: z.string(),
  answer: z.string(),
  explanation: z.string(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  topicId: z.string(),
  sectionId: z.string(),
});

export const AssemblyProviderResponseSchema = z.object({
  questions: z.array(AssemblyProviderQuestionSchema),
  reservationIds: z.array(z.string()),
  assemblyId: z.string(),
  expiresAt: z.string(),
});

export const QuestionAvailabilityDetailsSchema = z.object({
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  required: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
  missing: z.number().int().nonnegative(),
});

export const QuestionAvailabilityResponseSchema = z.object({
  status: z.enum(["AVAILABLE", "INSUFFICIENT_POOL"]),
  required: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
  missing: z.number().int().nonnegative(),
  details: z.array(QuestionAvailabilityDetailsSchema),
});
