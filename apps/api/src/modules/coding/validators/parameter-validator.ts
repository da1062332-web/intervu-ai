import { Injectable } from "@nestjs/common";

@Injectable()
export class ParameterValidator {
  validate(
    parameters: Record<string, any>,
    parameterSchema: Record<string, any>,
  ): string[] {
    const errors: string[] = [];

    if (!parameters || typeof parameters !== "object") {
      errors.push("Parameters object is missing or invalid.");
      return errors;
    }

    if (parameterSchema && typeof parameterSchema === "object") {
      for (const [key, spec] of Object.entries(parameterSchema)) {
        if (typeof spec === "object" && spec !== null) {
          const val = parameters[key];
          if (val === undefined || val === null) {
            errors.push(`Parameter "${key}" was not generated.`);
            continue;
          }
          if (typeof spec.min === "number" && val < spec.min) {
            errors.push(
              `Parameter "${key}" value ${val} is below minimum allowed ${spec.min}.`,
            );
          }
          if (typeof spec.max === "number" && val > spec.max) {
            errors.push(
              `Parameter "${key}" value ${val} exceeds maximum allowed ${spec.max}.`,
            );
          }
        }
      }
    }

    return errors;
  }
}
