import { Injectable } from "@nestjs/common";

@Injectable()
export class ConstraintValidator {
  validate(
    input: Record<string, any>,
    constraintSchema: Record<string, any>,
  ): string[] {
    const errors: string[] = [];

    if (!input || typeof input !== "object") {
      errors.push("Generated input payload is invalid or empty.");
      return errors;
    }

    if (constraintSchema && typeof constraintSchema === "object") {
      for (const [key, rules] of Object.entries(constraintSchema)) {
        const value = input[key];
        if (value === undefined) continue;

        if (typeof rules === "object" && rules !== null) {
          if (Array.isArray(value)) {
            if (
              typeof rules.maxSize === "number" &&
              value.length > rules.maxSize
            ) {
              errors.push(
                `Input array "${key}" size ${value.length} exceeds constraint maxSize ${rules.maxSize}.`,
              );
            }
            if (
              typeof rules.minSize === "number" &&
              value.length < rules.minSize
            ) {
              errors.push(
                `Input array "${key}" size ${value.length} is below constraint minSize ${rules.minSize}.`,
              );
            }
          }
        }
      }
    }

    return errors;
  }
}
