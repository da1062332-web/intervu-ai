import { z } from "zod";

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
});

export type ApiResponse = z.infer<typeof ApiResponseSchema>;
