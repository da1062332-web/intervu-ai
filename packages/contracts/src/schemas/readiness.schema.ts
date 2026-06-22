import { z } from "zod";

export const ReadinessCheckStatusSchema = z.enum(["PASS", "FAIL", "WARNING"]);

export const ReadinessCheckSchema = z.object({
  name: z.string(),
  status: ReadinessCheckStatusSchema,
  message: z.string().optional(),
});

export const ReadinessReportResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  status: z.enum(["NOT_READY", "PARTIALLY_READY", "READY"]),
  checks: z.array(ReadinessCheckSchema),
  report: z.any().optional(), // Can hold any JSON data including breakdown details
});

export type ReadinessCheckStatus = z.infer<typeof ReadinessCheckStatusSchema>;
export type ReadinessCheck = z.infer<typeof ReadinessCheckSchema>;
export type ReadinessReportResponse = z.infer<
  typeof ReadinessReportResponseSchema
>;
