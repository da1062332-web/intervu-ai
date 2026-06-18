import { z } from "zod";

export const ExamSectionResponseSchema = z.object({
  id: z.string().cuid(),
  examConfigId: z.string().cuid(),
  name: z.string(),
  code: z.string(),
  questionCount: z.number().int().positive(),
  sectionDurationMinutes: z.number().int().positive(),
  sectionOrder: z.number().int().positive(),
  isRequired: z.boolean(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export const ExamSectionListResponseSchema = z.array(ExamSectionResponseSchema);
