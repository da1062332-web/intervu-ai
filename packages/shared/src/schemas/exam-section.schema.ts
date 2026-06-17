import { z } from "zod";

export const ExamSectionResponseSchema = z.object({
  id: z.string().cuid(),
  examConfigId: z.string().cuid(),
  name: z.string(),
  questionCount: z.number().int().positive(),
  durationMinutes: z.number().int().positive().nullable(),
  displayOrder: z.number().int().positive(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export const ExamSectionListResponseSchema = z.array(ExamSectionResponseSchema);
