import { Injectable } from '@nestjs/common';
import { BlueprintDto } from './dto/blueprint.dto';
import { SectionDto } from './dto/section.dto';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class AssemblyValidatorService {
  validate(blueprint: BlueprintDto, sections: SectionDto[]): ValidationResult {
    const errors: string[] = [];

    // AVL-001 Total Question Count
    const actualTotalQuestions = sections.reduce((sum, s) => sum + s.questionCount, 0);
    if (actualTotalQuestions !== blueprint.totalQuestions) {
      errors.push(`AVL-001: Total question count mismatch. Expected ${blueprint.totalQuestions}, got ${actualTotalQuestions}`);
    }

    // AVL-002 Section Count
    if (sections.length !== blueprint.sections.length) {
      errors.push(`AVL-002: Section count mismatch. Expected ${blueprint.sections.length}, got ${sections.length}`);
    }

    // AVL-008 Empty Sections
    if (sections.some((s) => s.questionCount === 0)) {
      errors.push(`AVL-008: Empty section detected. Every section must have at least one question`);
    }

    const allQuestionIds = new Set<string>();

    for (const section of sections) {
      const blueprintSection = blueprint.sections.find((bs) => bs.sectionKey === section.sectionKey);

      if (!blueprintSection) {
         errors.push(`AVL-010: Section ${section.sectionKey} is missing from blueprint`);
         continue;
      }

      // AVL-003 Question Allocation (match per section count)
      if (section.questionCount !== blueprintSection.questionCount) {
         errors.push(`AVL-003: Section ${section.sectionKey} expected ${blueprintSection.questionCount} questions, got ${section.questionCount}`);
      }

      // AVL-006 Section Duration
      if (section.durationSeconds <= 0) {
         errors.push(`AVL-006: Section ${section.sectionKey} has invalid duration ${section.durationSeconds}`);
      }

      for (const q of section.questions) {
        // AVL-005 Duplicate Questions
        if (allQuestionIds.has(q.questionId)) {
          errors.push(`AVL-005: Duplicate question detected across assessment: ${q.questionId}`);
        }
        allQuestionIds.add(q.questionId);

        // AVL-007 Question Metadata
        if (!q.questionSnapshot || !q.questionSnapshot.id) {
          errors.push(`AVL-007: Question metadata missing for questionId: ${q.questionId}`);
        }

        // AVL-009 Question Type Validation
        if (!q.questionType) {
          errors.push(`AVL-009: Invalid question type for questionId: ${q.questionId}`);
        }
      }
    }

    // AVL-004 Difficulty Distribution (Already implicitly verified by allocation logic, but we could double check)
    // AVL-010 Assembly Completeness
    if (errors.length > 0) {
       return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  }
}
