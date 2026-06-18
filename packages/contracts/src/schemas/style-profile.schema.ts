import { z } from "zod";

export const StyleCharacteristicSchema = z.object({
  name: z.string().min(1, "characteristic name is required"),
  value: z.unknown(),
});

export const StyleProfileSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "name is required"),
  description: z.string().optional().nullable(),
  profileType: z.enum(["campus", "lateral", "executive", "certification"]),
  characteristics: z.array(StyleCharacteristicSchema).default([]),
  active: z.boolean().default(true),
});
