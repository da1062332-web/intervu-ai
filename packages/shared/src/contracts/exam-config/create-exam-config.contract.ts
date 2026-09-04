import { z } from "zod";

export const CreateExamConfigSchema = z.object({
  name: z.string().min(1).max(150),
  code: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  description: z.string().max(1000).nullable().optional(),
  durationMinutes: z.number().int().positive(),
  totalQuestions: z.number().int().positive(),
  sandboxUi: z.enum(["DEFAULT", "SANDBOX_2", "SANDBOX_3"]).default("DEFAULT").optional(),
});

export type CreateExamConfig = z.infer<typeof CreateExamConfigSchema>;
