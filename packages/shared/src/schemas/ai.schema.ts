import { z } from "zod";
import { DifficultyLevel } from "../enums/difficulty.enum";

export const GenerateQuestionRequestSchema = z.object({
  topic: z.string().min(1),
  difficulty: z.nativeEnum(DifficultyLevel),
  count: z.number().int().positive().max(50),
});
