import { z } from "zod";
import { CreateExamConfigSchema } from "./create-exam-config.contract";

export const UpdateExamConfigSchema = CreateExamConfigSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateExamConfig = z.infer<typeof UpdateExamConfigSchema>;
