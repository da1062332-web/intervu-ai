import { ZodError } from "zod";

export function formatZodError(error: ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join(".");
    return `${path ? path + ": " : ""}${err.message}`;
  });
}
