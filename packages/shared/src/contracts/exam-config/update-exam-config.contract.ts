import { z } from "zod";
import { CreateExamConfigSchema } from "./create-exam-config.contract";

export const UpdateExamConfigSchema = CreateExamConfigSchema.partial();

export type UpdateExamConfig = z.infer<typeof UpdateExamConfigSchema>;
