import {
  Injectable,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { EnrollmentRepository } from "../repositories/enrollment.repository";
import { EligibilityService } from "../../lifecycle/eligibility.service";
import {
  EnrollRequestDto,
  EnrollmentItemDto,
  EnrollmentListResponseDto,
  EnrollResponseDto,
} from "../dto/enroll.dto";

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly eligibilityService: EligibilityService,
  ) {}

  async enroll(
    userId: string,
    dto: EnrollRequestDto,
  ): Promise<EnrollResponseDto> {
    // 1. Check eligibility
    const eligibility = await this.eligibilityService.validateEligibility(
      userId,
      dto.testId,
    );

    if (!eligibility.eligible) {
      throw new BadRequestException(
        eligibility.reason || "Not eligible for this test",
      );
    }

    const targetConfigId = eligibility.resolvedConfigId || dto.testId;

    // 2. Check if already enrolled
    const existingEnrollment =
      await this.enrollmentRepository.findByUserAndTest(userId, targetConfigId);
    if (existingEnrollment) {
      const enrollments = await this.enrollmentRepository.findAllByUser(userId);
      const fullEnrollment: any = enrollments.find((e) => e.id === existingEnrollment.id);
      if (fullEnrollment) {
        return this.formatEnrollment(fullEnrollment);
      }
    }

    // 3. Create enrollment
    let enrollment;
    try {
      const data: any = {
        user: { connect: { id: userId } },
        status: "ENROLLED",
      };

      if (eligibility.isExamConfig) {
        data.examConfig = { connect: { id: targetConfigId } };
      } else {
        data.testConfig = { connect: { id: targetConfigId } };
      }

      enrollment = await this.enrollmentRepository.create(data);
    } catch (error: any) {
      if (error?.code === "P2002") {
        throw new ConflictException("You are already enrolled in this test");
      }
      throw error;
    }

    // Need to get the test config details to return the full item
    // In a real app we might do a join in the create or fetch after
    const enrollments = await this.enrollmentRepository.findAllByUser(userId);
    const fullEnrollment: any = enrollments.find((e) => e.id === enrollment.id);

    if (
      !fullEnrollment ||
      (!fullEnrollment.testConfig && !fullEnrollment.examConfig)
    ) {
      throw new Error("Failed to load created enrollment details");
    }

    return this.formatEnrollment(fullEnrollment);
  }

  private formatEnrollment(fullEnrollment: any): EnrollResponseDto {
    return {
      enrollment: {
        id: fullEnrollment.id,
        testId: fullEnrollment.examConfigId || fullEnrollment.testId,
        testName:
          fullEnrollment.examConfig?.name ||
          fullEnrollment.testConfig?.displayName ||
          "",
        company: fullEnrollment.testConfig?.companyName || "Unknown Company",
        status: fullEnrollment.status,
        durationSeconds: fullEnrollment.examConfig
          ? fullEnrollment.examConfig.durationMinutes * 60
          : fullEnrollment.testConfig?.totalDurationSeconds || 0,
        questionCount:
          fullEnrollment.examConfig?.totalQuestions ||
          fullEnrollment.testConfig?.totalQuestions ||
          0,
        enrolledAt: fullEnrollment.createdAt.toISOString(),
      },
    };
  }

  async getEnrollments(userId: string): Promise<EnrollmentListResponseDto> {
    const enrollments = await this.enrollmentRepository.findAllByUser(userId);

    return {
      enrollments: enrollments.map((e: any) => ({
        id: e.id,
        testId: e.examConfigId || e.testId,
        testName:
          e.examConfig?.name || e.testConfig?.displayName || "Unknown Test",
        company: e.testConfig?.companyName || "Unknown Company",
        status: e.status,
        durationSeconds: e.examConfig
          ? e.examConfig.durationMinutes * 60
          : e.testConfig?.totalDurationSeconds || 0,
        questionCount:
          e.examConfig?.totalQuestions || e.testConfig?.totalQuestions || 0,
        enrolledAt: e.createdAt.toISOString(),
      })),
    };
  }
}
