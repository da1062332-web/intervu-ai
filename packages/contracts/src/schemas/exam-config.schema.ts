import { z } from "zod";

export enum SandboxUIType {
  DEFAULT = "DEFAULT",
  SANDBOX_2 = "SANDBOX_2",
  SANDBOX_3 = "SANDBOX_3",
}

export const ExamConfigBaseSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(150, "Name cannot exceed 150 characters"),
  code: z
    .string()
    .min(1, "Code is required")
    .max(100, "Code cannot exceed 100 characters"),
  role: z
    .string()
    .min(1, "Role is required")
    .max(100, "Role cannot exceed 100 characters"),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .nullable()
    .optional(),
  durationMinutes: z.number().int().positive("Duration must be greater than 0"),
  totalQuestions: z
    .number()
    .int()
    .positive("Total questions must be greater than 0"),
  sandboxUi: z.nativeEnum(SandboxUIType).default(SandboxUIType.DEFAULT).optional(),
});

export const CreateExamConfigSchema = ExamConfigBaseSchema;

export const UpdateExamConfigSchema = ExamConfigBaseSchema.extend({
  status: z
    .enum(["DRAFT", "ACTIVE", "ARCHIVED", "VALIDATED", "PUBLISHED"])
    .optional(),
  isArchived: z.boolean().optional(),
}).partial();
