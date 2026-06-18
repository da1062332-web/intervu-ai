import { z } from "zod";

export const ExamConfigResponseSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  code: z.string(),
  role: z.string(),
  description: z.string().nullable().optional(),
  durationMinutes: z.number().int().positive(),
  totalQuestions: z.number().int().positive(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  isArchived: z.boolean(),
  createdBy: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export const ExamConfigListResponseSchema = z.array(ExamConfigResponseSchema);

export type ExamConfigResponse = z.infer<typeof ExamConfigResponseSchema>;
