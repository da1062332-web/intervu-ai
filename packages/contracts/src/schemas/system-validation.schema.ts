import { z } from "zod";

export const SystemValidationResponseSchema = z.object({
  valid: z.boolean(),
  score: z.number().int().min(0).max(100),
  errors: z.array(z.string()),
  breakdown: z.object({
    configuration: z.object({
      status: z.enum(["PASS", "FAIL", "WARNING"]),
      errors: z.array(z.string()),
    }),
    knowledge: z.object({
      status: z.enum(["PASS", "FAIL", "WARNING"]),
      errors: z.array(z.string()),
    }),
    templates: z.object({
      status: z.enum(["PASS", "FAIL", "WARNING"]),
      errors: z.array(z.string()),
    }),
    blueprint: z.object({
      status: z.enum(["PASS", "FAIL", "WARNING"]),
      errors: z.array(z.string()),
    }),
  }).optional(),
});

export type SystemValidationResponse = z.infer<typeof SystemValidationResponseSchema>;
