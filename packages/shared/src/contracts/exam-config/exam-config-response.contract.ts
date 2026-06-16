import { z } from "zod";

export const ExamConfigResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: z.string(),
  durationMinutes: z.number().int().positive(),
  totalQuestions: z.number().int().positive(),
  createdBy: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export const ExamConfigListResponseSchema = z.array(ExamConfigResponseSchema);

export type ExamConfigResponse = z.infer<typeof ExamConfigResponseSchema>;
