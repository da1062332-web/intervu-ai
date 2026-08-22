import { Injectable } from "@nestjs/common";
import { RuntimeTestDto, RuntimeValidationResultDto } from "../dto/runtime.dto";

@Injectable()
export class RuntimeValidationService {
  validate(test: RuntimeTestDto): RuntimeValidationResultDto {
    const errors: string[] = [];

    if (!test.testId) {
      errors.push("Test ID is missing");
    }

    if (test.duration < 0) {
      errors.push("Negative Duration is not allowed for the test");
    }

    if (!test.metadata) {
      errors.push("Missing Metadata at the test level");
    }

    if (!test.sections || test.sections.length === 0) {
      errors.push("Section Count must be greater than zero");
    }

    const questionIds = new Set<string>();

    test.sections?.forEach((section, index) => {
      if (!section.sectionId) {
        errors.push(`Invalid Section ID at section index ${index}`);
      }

      if (section.duration < 0) {
        errors.push(
          `Negative Duration in section ${section.sectionId || index}`,
        );
      }

      if (!section.questions || section.questions.length === 0) {
        errors.push(
          `Empty Sections are not allowed (Section ${section.sectionId || index})`,
        );
      } else {
        if (section.questionCount !== section.questions.length) {
          errors.push(
            `Question Count mismatch in section ${section.sectionId || index}`,
          );
        }

        section.questions.forEach((q, qIndex) => {
          if (!q.questionId) {
            errors.push(
              `Missing Questions: Question ID is missing in section ${section.sectionId || index} at index ${qIndex}`,
            );
          } else {
            if (questionIds.has(q.questionId)) {
              errors.push(`Duplicate Questions found: ${q.questionId}`);
            }
            questionIds.add(q.questionId);
          }

          if (!q.questionType) {
            errors.push(
              `Invalid Question Types: Question ${q.questionId || qIndex} is missing a type`,
            );
          }

          const isCoding =
            q.questionType === "CODING" ||
            Boolean(
              q.metadata?.codingData ||
                q.metadata?.starterCode ||
                q.metadata?.problemType,
            );

          if (
            !isCoding &&
            (q.questionType === "MULTIPLE_CHOICE" ||
              q.questionType === "MCQ") &&
            (!q.options || q.options.length === 0)
          ) {
            errors.push(
              `Missing Options for multiple choice question ${q.questionId}`,
            );
          }
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
