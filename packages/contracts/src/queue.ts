import { z } from "zod";
import { GenerationRequestSchema } from "./generation";

export const QueuePayloadSchema = z.object({
  requestId: z.string().min(1),
  correlationId: z.string().min(1),
  type: z.enum(["generation", "evaluation", "analytics"]),
  timestamp: z.string().datetime(),
  payload: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("generation"),
      data: GenerationRequestSchema,
      testId: z.string().optional(),
    }),
    z.object({
      type: z.literal("evaluation"),
      data: z.record(z.unknown()),
    }),
    z.object({
      type: z.literal("analytics"),
      data: z.record(z.unknown()),
    }),
  ]),
});

// eslint-disable-next-line @typescript-eslint/naming-convention
export type QueuePayload = z.infer<typeof QueuePayloadSchema>;
