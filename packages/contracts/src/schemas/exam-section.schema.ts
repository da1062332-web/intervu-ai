import { z } from "zod";

export const ExamSectionBaseSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),
  code: z
    .string()
    .min(1, "Code is required")
    .max(100, "Code cannot exceed 100 characters"),
  questionCount: z
    .number()
    .int()
    .positive("Question count must be greater than 0"),
  sectionDurationMinutes: z
    .number()
    .int()
    .positive("Section duration must be greater than 0"),
  sectionOrder: z
    .number()
    .int()
    .min(1, "Section order must be greater than or equal to 1"),
  isRequired: z.boolean().default(true),
});

export const CreateExamSectionSchema = ExamSectionBaseSchema;
export const UpdateExamSectionSchema = ExamSectionBaseSchema.partial();
