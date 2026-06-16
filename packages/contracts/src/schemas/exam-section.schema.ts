import { z } from "zod";

export const ExamSectionBaseSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),
  questionCount: z
    .number()
    .int()
    .positive("Question count must be greater than 0"),
  durationMinutes: z
    .number()
    .int()
    .positive("Duration must be greater than 0")
    .nullable()
    .optional(),
  displayOrder: z
    .number()
    .int()
    .min(1, "Display order must be greater than or equal to 1"),
});

export const CreateExamSectionSchema = ExamSectionBaseSchema;
export const UpdateExamSectionSchema = ExamSectionBaseSchema.partial();
