import { Injectable } from "@nestjs/common";

export interface ValidationResult {
  valid: boolean;
  unknownVariables: string[];
}

@Injectable()
export class PlaceholderValidatorService {
  /**
   * Validates placeholders in a template against a list of allowed variables.
   * Default allowed variables are 'answer' and 'explanation'.
   */
  validate(template: string, allowedVariables: string[]): ValidationResult {
    if (!template) {
      return { valid: true, unknownVariables: [] };
    }

    const defaultAllowed = ["answer", "explanation"];
    const allAllowed = new Set([...defaultAllowed, ...allowedVariables]);
    
    // Find all placeholders like {{variable_name}}
    const regex = /\{\{\s*([\w]+)\s*\}\}/g;
    const matches = Array.from(template.matchAll(regex));
    
    const extractedVariables = matches.map(match => match[1]);
    
    // Find unique unknown variables
    const unknownVariables = [...new Set(extractedVariables.filter(v => !allAllowed.has(v)))];
    
    return {
      valid: unknownVariables.length === 0,
      unknownVariables,
    };
  }
}
