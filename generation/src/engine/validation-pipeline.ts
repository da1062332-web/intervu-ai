import * as crypto from 'crypto';
import { QuestionTemplate, Variable, Constraint } from '../types/template.types';
import { evaluateConstraints } from './constraint-engine';
import { evaluateExpression } from './math-parser';
import { calculateDifficultyScore, getDifficultyCategory } from './difficulty-rules';

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  score: number;
}

/**
 * Normalizes text to tokens for semantic similarity checking.
 */
export function getTokens(text: string): Set<string> {
  const normalized = text
    .toLowerCase()
    .replace(/[0-9]+/g, '#') // treat all numbers as wildcards to detect structural duplicates
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ''); // remove punctuation
  return new Set(normalized.split(/\s+/).filter((word) => word.length > 2));
}

/**
 * Computes Jaccard semantic similarity between two question texts.
 */
export function calculateSemanticSimilarity(textA: string, textB: string): number {
  const tokensA = getTokens(textA);
  const tokensB = getTokens(textB);
  if (tokensA.size === 0 && tokensB.size === 0) return 1.0;

  const intersection = new Set([...tokensA].filter((x) => tokensB.has(x)));
  const union = new Set([...tokensA, ...tokensB]);

  return intersection.size / union.size;
}

/**
 * Evaluates semantic similarity against a threshold.
 */
export function isSemanticallySimilar(textA: string, textB: string, threshold = 0.85): boolean {
  return calculateSemanticSimilarity(textA, textB) >= threshold;
}

/**
 * Checks for variable parameter collisions against a list of past runs.
 */
export function checkVariableCollision(
  newParams: Record<string, unknown>,
  pastParamsList: Record<string, unknown>[]
): boolean {
  for (const past of pastParamsList) {
    let match = true;
    for (const key of Object.keys(newParams)) {
      if (newParams[key] !== past[key]) {
        match = false;
        break;
      }
    }
    if (match && Object.keys(newParams).length === Object.keys(past).length) {
      return true;
    }
  }
  return false;
}

/**
 * Validates calculated difficulty rules and mapping.
 */
export function validateDifficulty(
  template: QuestionTemplate,
  parameters: Record<string, unknown>
): { isValid: boolean; expectedCategory: string; score: number } {
  const constraintsCount = template.constraints ? template.constraints.length : 0;
  const score = calculateDifficultyScore(template.metadata, parameters, constraintsCount);
  const expectedCategory = getDifficultyCategory(score);
  return {
    isValid: expectedCategory === template.difficulty,
    expectedCategory,
    score,
  };
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
  hydratedQuestion?: string;
  pastQuestionTexts?: string[];
  pastParameters?: Record<string, unknown>[];
}): ValidationResult {
  const criticalIssues: string[] = [];
  const warningIssues: string[] = [];

  // 1. Variable Validation
  criticalIssues.push(...validateVariables(options.template.variables, options.parameters));

  // 2. Constraint Validation
  const evalResult = evaluateConstraints(options.template.constraints, options.parameters);
  for (const c of evalResult.violatedConstraints) {
    if (c.severity === 'critical') {
      criticalIssues.push(`Critical constraint rule violated: ${c.rule}`);
    } else {
      warningIssues.push(`Warning constraint rule violated: ${c.rule}`);
    }
  }

  // 3. Solvability Validation
  const solvability = validateSolvability(options.template.solutionTemplate.finalAnswer, options.parameters);
  if (!solvability.isSolvable) {
    criticalIssues.push(`Solvability failed: ${solvability.error}`);
  } else {
    const ans = String(solvability.answer);
    if (ans.trim() === '' || (isNaN(Number(ans)) && ans === 'NaN')) {
      criticalIssues.push(`Answer correctness check failed: evaluated value is invalid: ${ans}`);
    }
  }

  // 4. Ambiguity Detection
  criticalIssues.push(...validateAmbiguity(options.correctAnswer, options.distractors));

  // 5. Output Schema Validation
  if (options.distractors.length !== 3) {
    criticalIssues.push(`Schema validation failed: expected 3 distractors, got ${options.distractors.length}`);
  }
  for (const d of options.distractors) {
    if (!d || d.trim() === '') {
      criticalIssues.push(`Schema validation failed: empty distractor found`);
    }
  }
  if (!options.correctAnswer || options.correctAnswer.trim() === '') {
    criticalIssues.push(`Schema validation failed: empty correct answer`);
  }

  // 6. Duplicate Detection (Hash)
  const hash = generateQuestionHash(options.template.templateId, options.parameters);
  criticalIssues.push(...validateDuplicate(hash, options.seenHashes));

  // 7. Duplicate Detection (Variable Collision)
  if (options.pastParameters && checkVariableCollision(options.parameters, options.pastParameters)) {
    criticalIssues.push(`Variable collision detected: parameters match a previous generation run`);
  }

  // 8. Difficulty Rules Validation
  const difficultyCheck = validateDifficulty(options.template, options.parameters);
  if (!difficultyCheck.isValid) {
    criticalIssues.push(
      `Difficulty validation failed: expected category ${options.template.difficulty}, but calculated score of ${difficultyCheck.score} maps to ${difficultyCheck.expectedCategory}`
    );
  }

  // 9. Semantic Similarity Duplication Check
  if (options.hydratedQuestion && options.pastQuestionTexts) {
    for (const pastText of options.pastQuestionTexts) {
      if (isSemanticallySimilar(options.hydratedQuestion, pastText)) {
        criticalIssues.push(`Semantic duplicate detected: similarity threshold exceeded against past question`);
        break;
      }
    }
  }

  const allIssues = [...criticalIssues, ...warningIssues];

  // Calculate score according to the contract
  let score = 1.0;
  if (criticalIssues.length > 0) {
    score = 0.0;
  } else if (warningIssues.length > 0) {
    // Deduct 0.05 per warning issue (e.g. warning constraint violation), down to minimum of 0.1
    score = Math.max(0.1, 1.0 - warningIssues.length * 0.05);
    score = Math.round(score * 100) / 100;
  }

  return {
    valid: criticalIssues.length === 0,
    issues: allIssues,
    score,
  };
}
