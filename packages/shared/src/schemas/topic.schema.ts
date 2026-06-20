import { z } from "zod";
import { TopicStatus } from "@intervu-ai/contracts";

export const TopicResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable().optional(),
  status: z.nativeEnum(TopicStatus),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export const TopicListResponseSchema = z.array(TopicResponseSchema);
