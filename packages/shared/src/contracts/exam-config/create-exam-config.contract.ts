import { z } from "zod";

export const CreateExamConfigSchema = z.object({
  name: z.string().min(1).max(150),
  role: z.string().min(1).max(100),
  durationMinutes: z.number().int().positive(),
  totalQuestions: z.number().int().positive(),
});

export type CreateExamConfig = z.infer<typeof CreateExamConfigSchema>;
