import type { ExamConfig } from '@/services/exam-configs/types';
import type { Assessment, ValidationResult } from '../types';

export const validateAssessment = (blueprint: ExamConfig, assessment: Assessment): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (!blueprint) {
    errors.push('Blueprint is missing.');
    return { valid: false, errors, warnings, suggestions };
  }

  if (!assessment) {
    errors.push('Assessment is missing.');
    return { valid: false, errors, warnings, suggestions };
  }

  // We cannot check expectedSections dynamically because ExamConfig does not expose sections array directly here.

  // Check total question count
  const expectedQuestions = blueprint.totalQuestions || 0;
  let actualQuestions = 0;

  if (assessment.sections) {
    actualQuestions = assessment.sections.reduce((acc, sec) => acc + (sec.questions?.length || 0), 0);
  } else if (assessment.questions) {
    actualQuestions = assessment.questions.length;
  }

  if (expectedQuestions > 0 && actualQuestions !== expectedQuestions) {
    errors.push(`Expected ${expectedQuestions} total questions, but got ${actualQuestions}.`);
  } else if (actualQuestions === 0) {
    warnings.push('Assessment contains no questions.');
  }

  // Duplicate detection
  const questionIds = new Set<string>();
  const duplicates = new Set<string>();
  
  const allQuestions = assessment.questions || (assessment.sections?.flatMap(s => s.questions || []) || []);
  
  allQuestions.forEach(q => {
    if (questionIds.has(q.id)) {
      duplicates.add(q.id);
    } else {
      questionIds.add(q.id);
    }
  });

  if (duplicates.size > 0) {
    errors.push(`Found ${duplicates.size} duplicate questions in the assessment.`);
    suggestions.push('Regenerate the assessment to ensure unique questions.');
  }

  // Validate Difficulty Distribution
  if (allQuestions.length > 5) {
    const difficulties = new Set(allQuestions.map(q => q.difficulty));
    if (difficulties.size === 1) {
      warnings.push(`All questions are of difficulty ${Array.from(difficulties)[0]}. Is this intended?`);
    }
  }

  // Section-wise distribution
  if (assessment.sections) {
    assessment.sections.forEach(sec => {
      if (!sec.questions || sec.questions.length === 0) {
        errors.push(`Section "${sec.name}" has no questions.`);
      }
    });
  }

  // Topic and Concept-wise distribution
  const missingTopic = allQuestions.filter(q => !q.topicId);
  if (missingTopic.length > 0) {
    warnings.push(`${missingTopic.length} questions are missing topic assignments.`);
  }

  const missingConcept = allQuestions.filter(q => !q.conceptKey);
  if (missingConcept.length > 0) {
    warnings.push(`${missingConcept.length} questions are missing concept assignments.`);
  }

  // Template usage and weightage (assuming if template is missing, it's a structural issue)
  // Check if at least some questions use advanced concepts or standard patterns
  const standardQuestions = allQuestions.filter(q => q.conceptKey === 'standard' || !q.conceptKey);
  if (standardQuestions.length === allQuestions.length && allQuestions.length > 5) {
    suggestions.push('Consider diversifying the concept weightage (e.g., using advanced templates).');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
};
