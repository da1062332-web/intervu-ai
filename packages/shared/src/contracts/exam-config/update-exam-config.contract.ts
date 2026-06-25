import { z } from "zod";
import { CreateExamConfigSchema } from "./create-exam-config.contract";

export const UpdateExamConfigSchema = CreateExamConfigSchema.partial().extend({
  isActive: z.boolean().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "VALIDATED", "PUBLISHED"]).optional(),
  isArchived: z.boolean().optional(),
});

export type UpdateExamConfig = z.infer<typeof UpdateExamConfigSchema>;
