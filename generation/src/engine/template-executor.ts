import { PRNG } from './prng';
import { generateVariables, roundToPrecision } from './variable-generator';
import { evaluateConstraints } from './constraint-engine';
import { evaluateExpression } from './math-parser';
import { calculateDifficultyScore, getDifficultyCategory } from './difficulty-rules';
import { validatePipeline, generateQuestionHash, checkVariableCollision, isSemanticallySimilar } from './validation-pipeline';
import { QuestionTemplate } from '../types/template.types';
import { ValidationFailureReason } from './metrics-tracker';

export interface HydratedSolution {
  steps: string[];
  finalAnswer: string;
}

export interface GeneratedOutput {
  question: string;
  options: string[];
  correctAnswer: string;
  solution: HydratedSolution;
  difficulty: 'easy' | 'medium' | 'hard';
  hash: string;
  parameters: Record<string, unknown>;
}

/**
 * Hydrates placeholders in the template string (e.g., {variable} or {(math expression)}).
 */
export function hydrateString(template: string, parameters: Record<string, unknown>): string {
  return template.replace(/\{([^}]+)\}/g, (match, expr) => {
    const trimmed = expr.trim();
    if (trimmed in parameters) {
      return String(parameters[trimmed]);
    }
    try {
      const result = evaluateExpression(trimmed, parameters);
      // Format number properties
      if (typeof result === 'number') {
        return String(roundToPrecision(result, 0.01));
      }
      return String(result);
    } catch {
      return match;
    }
  });
}

/**
 * Generates 3 unique distractors based on the correct answer.
 */
export function generateDistractors(correctVal: number): string[] {
  const distractors = new Set<string>();
  const isInt = Number.isInteger(correctVal);

  const perturbations = [
    (v: number) => v + (isInt ? 1 : 0.5),
    (v: number) => v - (isInt ? 1 : 0.5),
    (v: number) => v + (isInt ? 2 : 0.1),
    (v: number) => v - (isInt ? 2 : 0.1),
    (v: number) => v * 1.2,
    (v: number) => v * 0.8,
    (v: number) => v + (isInt ? 5 : 1.5),
    (v: number) => v - (isInt ? 5 : 1.5),
    (v: number) => v * 1.5,
    (v: number) => v * 0.5,
  ];

  for (const perturb of perturbations) {
    if (distractors.size >= 3) break;
    const rawVal = perturb(correctVal);
    const rounded = roundToPrecision(rawVal, isInt ? 1 : 0.01);
    const strVal = String(rounded);
    if (strVal !== String(correctVal) && rawVal > 0) {
      distractors.add(strVal);
    }
  }

  // Fallback if not enough unique positive distractors are found
  let offset = 1;
  while (distractors.size < 3) {
    const rawVal = correctVal + offset;
    const rounded = roundToPrecision(rawVal, isInt ? 1 : 0.01);
    const strVal = String(rounded);
    if (strVal !== String(correctVal)) {
      distractors.add(strVal);
    }
    offset += 1;
  }

  return Array.from(distractors).slice(0, 3);
}

/**
 * Main function to execute a question template using a given seed.
 */
export function executeTemplate(
  template: QuestionTemplate,
  seed: number,
  seenHashes: Set<string> | string[] = new Set(),
  tracker?: { recordFailure: (reason: ValidationFailureReason) => void },
  pastParameters?: Record<string, unknown>[],
  pastQuestionTexts?: string[]
): GeneratedOutput {
  const prng = new PRNG(seed);
  let parameters: Record<string, unknown> = {};
  let correctAnswerVal = 0;
  let attempt = 0;
  const maxAttempts = 100;
  let finalHash = '';

  // 1. Generation & Constraint check retry loop
  while (attempt < maxAttempts) {
    attempt++;
    parameters = generateVariables(template.variables, prng);

    // Evaluate constraints (Must satisfy all critical rules)
    const constraintCheck = evaluateConstraints(template.constraints, parameters);
    if (!constraintCheck.isValid) {
      tracker?.recordFailure('constraint_violation');
      continue;
    }

    // Evaluate difficulty score & ensure consistency
    const constraintsCount = template.constraints ? template.constraints.length : 0;
    const score = calculateDifficultyScore(template.metadata, parameters, constraintsCount);
    const category = getDifficultyCategory(score);
    if (category !== template.difficulty) {
      tracker?.recordFailure('difficulty_mismatch');
      continue;
    }

    // Verify Solvability
    try {
      const evaluated = evaluateExpression(template.solutionTemplate.finalAnswer, parameters);
      if (typeof evaluated !== 'number' || isNaN(evaluated) || !isFinite(evaluated)) {
        tracker?.recordFailure('solvability_failure');
        continue;
      }
      correctAnswerVal = evaluated;
    } catch {
      tracker?.recordFailure('solvability_failure');
      continue;
    }

    // Check duplicate hash
    finalHash = generateQuestionHash(template.templateId, parameters);
    const hashesSet = seenHashes instanceof Set ? seenHashes : new Set(seenHashes);
    if (hashesSet.has(finalHash)) {
      tracker?.recordFailure('duplicate_collision');
      continue;
    }

    // Check variable collision in loop
    if (pastParameters && checkVariableCollision(parameters, pastParameters)) {
      tracker?.recordFailure('duplicate_collision');
      continue;
    }

    // Check semantic similarity in loop
    if (pastQuestionTexts) {
      const newQuestionText = hydrateString(template.questionTemplate, parameters);
      let isDuplicate = false;
      for (const pastText of pastQuestionTexts) {
        if (isSemanticallySimilar(newQuestionText, pastText)) {
          isDuplicate = true;
          break;
        }
      }
      if (isDuplicate) {
        tracker?.recordFailure('duplicate_collision');
        continue;
      }
    }

    // If we passed all checks, we are good to go!
    break;
  }

  if (attempt >= maxAttempts) {
    throw new Error(`Failed to generate a valid, unique question for template ${template.templateId} after ${maxAttempts} attempts`);
  }

  // 2. Hydrate Question & Solution steps
  const hydratedQuestion = hydrateString(template.questionTemplate, parameters);
  const hydratedSteps = template.solutionTemplate.steps.map((step) => hydrateString(step, parameters));
  
  // Format correct answer to string
  const isAnswerInt = Number.isInteger(correctAnswerVal);
  const formattedAnswer = String(roundToPrecision(correctAnswerVal, isAnswerInt ? 1 : 0.01));

  // 3. Generate distractors
  const distractors = generateDistractors(correctAnswerVal);

  // 4. Validate output using the pipeline
  const validation = validatePipeline({
    template,
    parameters,
    correctAnswer: formattedAnswer,
    distractors,
    seenHashes,
    hydratedQuestion,
    pastQuestionTexts,
    pastParameters,
  });

  if (!validation.valid) {
    throw new Error(`Generated question failed validation pipeline: ${validation.issues.join(', ')}`);
  }

  // 5. Shuffle options deterministically using PRNG
  const allOptions = [formattedAnswer, ...distractors];
  const shuffledOptions = prng.shuffle(allOptions);

  return {
    question: hydratedQuestion,
    options: shuffledOptions,
    correctAnswer: formattedAnswer,
    solution: {
      steps: hydratedSteps,
      finalAnswer: formattedAnswer,
    },
    difficulty: template.difficulty,
    hash: finalHash,
    parameters,
  };
}
