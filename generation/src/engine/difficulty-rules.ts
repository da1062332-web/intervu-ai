import { DifficultyMetadata } from '../types/template.types';

/**
 * Calculates a dynamic complexity score based on the actual generated parameters.
 * Larger values or decimal results increase complexity.
 */
export function calculateDynamicComplexity(
  baseComplexity: number,
  parameters: Record<string, unknown>
): number {
  let dynamicOffset = 0;
  for (const key of Object.keys(parameters)) {
    const val = parameters[key];
    if (typeof val === 'number') {
      // Numbers with decimals increase computation difficulty
      if (!Number.isInteger(val)) {
        dynamicOffset += 0.5;
      }
      // Large numbers (>= 1000) increase mental computation complexity
      if (Math.abs(val) >= 1000) {
        dynamicOffset += 0.5;
      }
    }
  }
  return baseComplexity + dynamicOffset;
}

/**
 * Computes the difficulty score using the formula:
 * Score = (steps * 0.65) + (complexity * 0.40) + (overlap * 0.40) + (trick * 0.40) + (constraintsCount * 0.15)
 */
export function calculateDifficultyScore(
  metadata: DifficultyMetadata,
  parameters: Record<string, unknown>,
  constraintsCount: number = 0
): number {
  const steps = metadata.w1_steps;
  const baseComplexity = metadata.w2_number_complexity;
  const overlap = metadata.w3_concept_overlap;
  const trick = metadata.w4_trick_factor;
  const w5_constraints = 0.15;

  const dynamicComplexity = calculateDynamicComplexity(baseComplexity, parameters);

  const score =
    (steps * 0.65) +
    (dynamicComplexity * 0.40) +
    (overlap * 0.40) +
    (trick * 0.40) +
    (constraintsCount * w5_constraints);

  // Round to 2 decimal places to avoid floating point issues
  return Math.round(score * 100) / 100;
}

/**
 * Predicates to check difficulty category.
 */
export function isEasy(score: number): boolean {
  return score < 3.0;
}

export function isMedium(score: number): boolean {
  return score >= 3.0 && score < 6.0;
}

export function isHard(score: number): boolean {
  return score >= 6.0;
}

/**
 * Categorizes the difficulty score into EASY, MEDIUM, or HARD.
 */
export function getDifficultyCategory(score: number): 'easy' | 'medium' | 'hard' {
  if (isEasy(score)) {
    return 'easy';
  } else if (isMedium(score)) {
    return 'medium';
  } else {
    return 'hard';
  }
}
