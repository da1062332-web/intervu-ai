import { Injectable } from "@nestjs/common";

@Injectable()
export class TemplateRendererService {
  /**
   * Deterministic pure function to render placeholders in a template
   * Supports placeholders in the format {{variable_name}}
   */
  render(
    template: string,
    payload: Record<string, unknown>,
  ): { renderedOutput: string; resolvedVariables: Record<string, unknown> } {
    if (!template) {
      return { renderedOutput: "", resolvedVariables: {} };
    }
    const resolvedVariables: Record<string, unknown> = {};
    const renderedOutput = template.replace(
      /\{\{\s*([\w]+)\s*\}\}/g,
      (match, key) => {
        const value = payload[key];
        if (value !== undefined && value !== null) {
          resolvedVariables[key] = value;
          if (typeof value === "object") {
            return JSON.stringify(value);
          }
          return String(value);
        }
        return match;
      },
    );
    return { renderedOutput, resolvedVariables };
  }
}
