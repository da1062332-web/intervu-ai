import * as crypto from 'crypto';
import { QuestionTemplate, Variable, Constraint } from '../types/template.types';
import { evaluateConstraints } from './constraint-engine';
import { evaluateExpression } from './math-parser';

export interface ValidationResult {
  valid: boolean;
  issues: string[];
}

/**
 * Computes a unique SHA-256 hash for a given template and parameters set.
 */
export function generateQuestionHash(templateId: string, parameters: Record<string, unknown>): string {
  const sortedKeys = Object.keys(parameters).sort();
  const sortedParams: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sortedParams[key] = parameters[key];
  }
  const serialized = `${templateId}|${JSON.stringify(sortedParams)}`;
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

/**
 * Stage 1: Variable Validation
 */
export function validateVariables(variables: Variable[], parameters: Record<string, unknown>): string[] {
  const issues: string[] = [];
  for (const variable of variables) {
    const val = parameters[variable.name];
    if (val === undefined) {
      issues.push(`Variable ${variable.name} is missing.`);
      continue;
    }

    if (variable.type === 'number') {
      if (typeof val !== 'number') {
        issues.push(`Variable ${variable.name} must be a number, got ${typeof val}.`);
        continue;
      }
      const { min, max } = variable.range;
      if (val < min || val > max) {
        issues.push(`Variable ${variable.name} value ${val} is out of range [${min}, ${max}].`);
      }
    } else if (variable.type === 'string') {
      if (typeof val !== 'string') {
        issues.push(`Variable ${variable.name} must be a string, got ${typeof val}.`);
        continue;
      }
      if (!variable.options.includes(val)) {
        issues.push(`Variable ${variable.name} value "${val}" is not in options [${variable.options.join(', ')}].`);
      }
    }
  }
  return issues;
}

/**
 * Stage 2: Constraint Validation
 */
export function validateConstraintsPipeline(constraints: Constraint[], parameters: Record<string, unknown>): string[] {
  const issues: string[] = [];
  const evalResult = evaluateConstraints(constraints, parameters);
  if (!evalResult.isValid) {
    for (const c of evalResult.violatedConstraints) {
      if (c.severity === 'critical') {
        issues.push(`Critical constraint rule violated: ${c.rule}`);
      }
    }
  }
  return issues;
}

/**
 * Stage 3: Solvability Validation
 */
export function validateSolvability(finalAnswerFormula: string, parameters: Record<string, unknown>): { isSolvable: boolean; answer: unknown; error?: string } {
  try {
    const answer = evaluateExpression(finalAnswerFormula, parameters);
    if (answer === undefined || answer === null || typeof answer !== 'number' || isNaN(answer) || !isFinite(answer)) {
      return { isSolvable: false, answer: null, error: `Evaluated answer is not a finite number: ${answer}` };
    }
    return { isSolvable: true, answer };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { isSolvable: false, answer: null, error: message };
  }
}

/**
 * Stage 4: Ambiguity Detection
 */
export function validateAmbiguity(correctAnswer: string, distractors: string[]): string[] {
  const issues: string[] = [];
  if (distractors.includes(correctAnswer)) {
    issues.push(`Ambiguity detected: Correct answer "${correctAnswer}" is also one of the distractors.`);
  }
  const uniqueDistractors = new Set(distractors);
  if (uniqueDistractors.size !== distractors.length) {
    issues.push(`Duplicate distractors detected: [${distractors.join(', ')}]`);
  }
  return issues;
}

/**
 * Stage 5: Duplicate Detection
 */
export function validateDuplicate(
  hash: string,
  seenHashes: Set<string> | string[]
): string[] {
  const issues: string[] = [];
  const hashesSet = seenHashes instanceof Set ? seenHashes : new Set(seenHashes);
  if (hashesSet.has(hash)) {
    issues.push(`Duplicate question detected: Hash "${hash}" has already been generated.`);
  }
  return issues;
}

/**
 * Main validation entrypoint combining all verification stages.
 */
export function validatePipeline(options: {
  template: QuestionTemplate;
  parameters: Record<string, unknown>;
  correctAnswer: string;
  distractors: string[];
  seenHashes: Set<string> | string[];
}): ValidationResult {
  const issues: string[] = [];

  // 1. Variable Validation
  issues.push(...validateVariables(options.template.variables, options.parameters));

  // 2. Constraint Validation
  issues.push(...validateConstraintsPipeline(options.template.constraints, options.parameters));

  // 3. Solvability Validation
  const solvability = validateSolvability(options.template.solutionTemplate.finalAnswer, options.parameters);
  if (!solvability.isSolvable) {
    issues.push(`Solvability failed: ${solvability.error}`);
  }

  // 4. Ambiguity Detection
  issues.push(...validateAmbiguity(options.correctAnswer, options.distractors));

  // 5. Duplicate Detection
  const hash = generateQuestionHash(options.template.templateId, options.parameters);
  issues.push(...validateDuplicate(hash, options.seenHashes));

  return {
    valid: issues.length === 0,
    issues,
  };
}
