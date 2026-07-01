import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { ExecutionValidatorService } from "./execution-validator.service";
import {
  TestInstanceRepository,
  SubmissionRepository,
  CandidateAnswerRepository,
} from "../repositories";

export interface SubmissionValidationResult {
  isValid: boolean;
  errors: string[];
  missingQuestionIds: string[];
  isExpired: boolean;
  isDuplicate: boolean;
}

@Injectable()
export class SubmissionValidationService {
  private readonly logger = new AppLogger({
    name: "SubmissionValidationService",
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: ExecutionValidatorService,
    private readonly testInstanceRepo: TestInstanceRepository,
    private readonly submissionRepo: SubmissionRepository,
    private readonly answerRepo: CandidateAnswerRepository,
  ) {}

  async validateSubmission(
    testInstanceId: string,
    userId: string,
  ): Promise<SubmissionValidationResult> {
    this.logger.debug("Running pre-submission validation pipeline", {
      testInstanceId,
    });
    const errors: string[] = [];
    const missingQuestionIds: string[] = [];
    let isExpired = false;
    let isDuplicate = false;

    // 1. Fetch test instance with sections/questions
    const testInstance =
      await this.testInstanceRepo.loadDeepSnapshot(testInstanceId);
    if (!testInstance) {
      throw new NotFoundException({
        code: "ASSESSMENT_NOT_FOUND",
        message: "Assessment not found",
      });
    }

    // 2. Validate Candidate Ownership
    if (testInstance.userId !== userId) {
      throw new BadRequestException({
        code: "UNAUTHORIZED_ACCESS",
        message: "You are not authorized to submit this assessment",
      });
    }

    // 3. Validate Attempt Status (Duplicate Submission check)
    if (
      testInstance.status === "SUBMITTED" ||
      testInstance.status === "COMPLETED"
    ) {
      isDuplicate = true;
      errors.push(
        "Duplicate Submission: This assessment has already been submitted.",
      );
    }

    // Check existing submission record
    const existingSubmission = await this.submissionRepo.findAll({
      testInstanceId,
    });
    if (existingSubmission.length > 0) {
      isDuplicate = true;
      if (
        !errors.includes(
          "Duplicate Submission: This assessment has already been submitted.",
        )
      ) {
        errors.push(
          "Duplicate Submission: This assessment has already been submitted.",
        );
      }
    }

    // 4. Validate Assessment Time Window (Expired Session check)
    if (testInstance.expiresAt && testInstance.expiresAt < new Date()) {
      isExpired = true;
      errors.push(
        "Expired Session: The allowed time window for this assessment has expired.",
      );
    }

    // 5. Check Required Questions & Answer Integrity
    const candidateAnswers = await this.answerRepo.findAll({ testInstanceId });
    const answerMap = new Map(candidateAnswers.map((a) => [a.questionId, a]));

    for (const section of testInstance.sections) {
      for (const question of section.questions) {
        const candidateAnswer = answerMap.get(question.questionId);

        // Check if answer is missing
        if (!candidateAnswer || !candidateAnswer.answer) {
          missingQuestionIds.push(question.questionId);
        } else {
          try {
            let parsed = candidateAnswer.answer;
            if (typeof parsed === "string") {
              try {
                parsed = JSON.parse(parsed);
              } catch (e) {
                // Keep as plain string, no issue
              }
            }
            if (
              !parsed ||
              (typeof parsed === "object" && Object.keys(parsed).length === 0)
            ) {
              missingQuestionIds.push(question.questionId);
            }
          } catch (e) {
            errors.push(
              `Answer integrity check failed for question ${question.questionId}: Invalid data.`,
            );
          }
        }
      }
    }

    if (missingQuestionIds.length > 0) {
      errors.push(
        `Missing Answers: ${missingQuestionIds.length} required questions have not been answered.`,
      );
    }

    const isValid = errors.length === 0;

    this.logger.debug("Pre-submission validation completed", {
      testInstanceId,
      isValid,
      errorsCount: errors.length,
    });

    return {
      isValid,
      errors,
      missingQuestionIds,
      isExpired,
      isDuplicate,
    };
  }
}
