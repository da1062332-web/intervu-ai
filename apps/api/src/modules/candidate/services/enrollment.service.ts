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

    // 2. Check if already enrolled
    const existingEnrollment =
      await this.enrollmentRepository.findByUserAndTest(userId, dto.testId);
    if (existingEnrollment) {
      throw new ConflictException("You are already enrolled in this test");
    }

    // 3. Create enrollment
    const enrollment = await this.enrollmentRepository.create({
      user: { connect: { id: userId } },
      testConfig: { connect: { id: dto.testId } },
      status: "ENROLLED",
    });

    // Need to get the test config details to return the full item
    // In a real app we might do a join in the create or fetch after
    const enrollments = await this.enrollmentRepository.findAllByUser(userId);
    const fullEnrollment = enrollments.find((e) => e.id === enrollment.id);

    if (!fullEnrollment || !fullEnrollment.testConfig) {
      throw new Error("Failed to load created enrollment details");
    }

    return {
      enrollment: {
        id: fullEnrollment.id,
        testId: fullEnrollment.testId,
        testName: fullEnrollment.testConfig.displayName,
        company: fullEnrollment.testConfig.companyName,
        status: fullEnrollment.status,
        durationSeconds: fullEnrollment.testConfig.totalDurationSeconds,
        questionCount: fullEnrollment.testConfig.totalQuestions,
        enrolledAt: fullEnrollment.createdAt.toISOString(),
      },
    };
  }

  async getEnrollments(userId: string): Promise<EnrollmentListResponseDto> {
    const enrollments = await this.enrollmentRepository.findAllByUser(userId);

    return {
      enrollments: enrollments.map((e) => ({
        id: e.id,
        testId: e.testId,
        testName: e.testConfig?.displayName || "Unknown Test",
        company: e.testConfig?.companyName || "Unknown Company",
        status: e.status,
        durationSeconds: e.testConfig?.totalDurationSeconds || 0,
        questionCount: e.testConfig?.totalQuestions || 0,
        enrolledAt: e.createdAt.toISOString(),
      })),
    };
  }
}
