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
 * Score = (steps * 0.65) + (complexity * 0.40) + (overlap * 0.40) + (trick * 0.40)
 */
export function calculateDifficultyScore(
  metadata: DifficultyMetadata,
  parameters: Record<string, unknown>
): number {
  const steps = metadata.w1_steps;
  const baseComplexity = metadata.w2_number_complexity;
  const overlap = metadata.w3_concept_overlap;
  const trick = metadata.w4_trick_factor;

  const dynamicComplexity = calculateDynamicComplexity(baseComplexity, parameters);

  const score = (steps * 0.65) + (dynamicComplexity * 0.40) + (overlap * 0.40) + (trick * 0.40);
  
  // Round to 2 decimal places to avoid floating point issues
  return Math.round(score * 100) / 100;
}

/**
 * Categorizes the difficulty score into EASY, MEDIUM, or HARD.
 */
export function getDifficultyCategory(score: number): 'easy' | 'medium' | 'hard' {
  if (score < 3.0) {
    return 'easy';
  } else if (score < 6.0) {
    return 'medium';
  } else {
    return 'hard';
  }
}
