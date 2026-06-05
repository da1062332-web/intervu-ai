import { SetMetadata } from "@nestjs/common";
import { ZodSchema } from "zod";

export const RESPONSE_SCHEMA_KEY = "response_schema";

export const ValidateResponse = (schema: ZodSchema<unknown>) =>
  SetMetadata(RESPONSE_SCHEMA_KEY, schema);
