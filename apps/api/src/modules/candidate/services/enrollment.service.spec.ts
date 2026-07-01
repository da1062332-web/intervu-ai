import { Test, TestingModule } from "@nestjs/testing";
import { EnrollmentService } from "./enrollment.service";
import { EnrollmentRepository } from "../repositories/enrollment.repository";
import { EligibilityService } from "../../lifecycle/eligibility.service";
import { BadRequestException, ConflictException } from "@nestjs/common";

describe("EnrollmentService", () => {
  let service: EnrollmentService;
  let repository: EnrollmentRepository;
  let eligibilityService: EligibilityService;

  beforeEach(async () => {
    const mockRepository = {
      findByUserAndTest: jest.fn(),
      findAllByUser: jest.fn(),
      create: jest.fn(),
    };

    const mockEligibilityService = {
      validateEligibility: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentService,
        { provide: EnrollmentRepository, useValue: mockRepository },
        { provide: EligibilityService, useValue: mockEligibilityService },
      ],
    }).compile();

    service = module.get<EnrollmentService>(EnrollmentService);
    repository = module.get<EnrollmentRepository>(EnrollmentRepository);
    eligibilityService = module.get<EligibilityService>(EligibilityService);
  });

  describe("enroll", () => {
    it("should throw BadRequest if not eligible", async () => {
      jest.spyOn(eligibilityService, "validateEligibility").mockResolvedValue({
        eligible: false,
        reason: "Test limit reached",
      });

      await expect(
        service.enroll("user1", { testId: "test1" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw Conflict if already enrolled", async () => {
      jest
        .spyOn(eligibilityService, "validateEligibility")
        .mockResolvedValue({ eligible: true });
      jest
        .spyOn(repository, "findByUserAndTest")
        .mockResolvedValue({ id: "enroll1" } as any);

      await expect(
        service.enroll("user1", { testId: "test1" }),
      ).rejects.toThrow(ConflictException);
    });

    it("should create enrollment and return it", async () => {
      jest
        .spyOn(eligibilityService, "validateEligibility")
        .mockResolvedValue({ eligible: true });
      jest.spyOn(repository, "findByUserAndTest").mockResolvedValue(null);
      jest
        .spyOn(repository, "create")
        .mockResolvedValue({ id: "enroll1" } as any);

      const mockDate = new Date();
      jest.spyOn(repository, "findAllByUser").mockResolvedValue([
        {
          id: "enroll1",
          testId: "test1",
          status: "ENROLLED",
          createdAt: mockDate,
          testConfig: {
            displayName: "Test 1",
            companyName: "Acme",
            totalDurationSeconds: 3600,
            totalQuestions: 10,
          },
        } as any,
      ]);

      const result = await service.enroll("user1", { testId: "test1" });

      expect(result.enrollment).toEqual({
        id: "enroll1",
        testId: "test1",
        testName: "Test 1",
        company: "Acme",
        status: "ENROLLED",
        durationSeconds: 3600,
        questionCount: 10,
        enrolledAt: mockDate.toISOString(),
      });
    });
  });

  describe("getEnrollments", () => {
    it("should return formatted enrollments", async () => {
      const mockDate = new Date();
      jest.spyOn(repository, "findAllByUser").mockResolvedValue([
        {
          id: "enroll1",
          testId: "test1",
          status: "ENROLLED",
          createdAt: mockDate,
          testConfig: {
            displayName: "Test 1",
            companyName: "Acme",
            totalDurationSeconds: 3600,
            totalQuestions: 10,
          },
        } as any,
      ]);

      const result = await service.getEnrollments("user1");

      expect(result.enrollments).toHaveLength(1);
      expect(result.enrollments[0].testName).toBe("Test 1");
    });
  });
});
