import { Injectable } from "@nestjs/common";
import { UserRepository } from "../users/repositories/user.repository";
import { TestConfigRepository } from "../tests/repositories/test-config.repository";
import { TestInstanceRepository } from "../tests/test-instance/test-instance.repository";
import { PrismaService } from "../../prisma/prisma.service";

export interface EligibilityResult {
  eligible: boolean;
  errorCode?: string;
  reason?: string;
  activeTestId?: string;
  isExamConfig?: boolean;
  resolvedConfigId?: string;
}

@Injectable()
export class EligibilityService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly testConfigRepository: TestConfigRepository,
    private readonly testInstanceRepository: TestInstanceRepository,
    private readonly prisma: PrismaService,
  ) {}

  async validateEligibility(
    userId: string,
    testConfigId: string,
  ): Promise<EligibilityResult> {
    // Validate User Exists and Account Active (Assuming all non-deleted users are active)
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return {
        eligible: false,
        errorCode: "USER_NOT_ELIGIBLE",
        reason: "User does not exist or is inactive",
      };
    }

    // Validate Config Exists and is Active
    let config: any = await this.testConfigRepository.findById(testConfigId);
    let isExamConfig = false;

    if (!config) {
      config = await this.prisma.examConfig.findUnique({
        where: { id: testConfigId },
        include: { ruleFlags: true },
      });
      if (config) {
        isExamConfig = true;
      }
    }

    // Fallback: If passed ID is a testInstance ID or assembledTest ID, resolve the parent config ID
    if (!config) {
      const testInstance = await this.prisma.testInstance.findUnique({
        where: { id: testConfigId },
        select: { examConfigId: true, testConfigId: true },
      });

      const resolvedConfigId = testInstance?.examConfigId || testInstance?.testConfigId;

      if (resolvedConfigId) {
        testConfigId = resolvedConfigId;
        config = await this.prisma.examConfig.findUnique({
          where: { id: resolvedConfigId },
          include: { ruleFlags: true },
        });
        if (config) {
          isExamConfig = true;
        } else {
          config = await this.testConfigRepository.findById(resolvedConfigId);
        }
      }
    }

    if (!config) {
      return {
        eligible: false,
        errorCode: "TEST_CONFIG_NOT_FOUND",
        reason: "Configuration does not exist",
      };
    }

    if (!config.isActive) {
      return {
        eligible: false,
        errorCode: "TEST_CONFIG_NOT_ACTIVE",
        reason: "Configuration is not active",
      };
    }

    if (isExamConfig) {
      const publishedAssembly = await this.prisma.assembledTest.findFirst({
        where: {
          configId: testConfigId,
          status: "PUBLISHED",
        },
      });

      if (!publishedAssembly && config.status === "DRAFT") {
        return {
          eligible: false,
          errorCode: "TEST_NOT_PUBLISHED",
          reason:
            "This assessment is still in DRAFT mode and has not been published by the administrator.",
        };
      }
    }

    // Validate Active Test Limit (User shouldn't have an ongoing test for the same config)
    // Only block if there is an actively IN_PROGRESS attempt (not COMPLETED/SUBMITTED)
    const activeTest = isExamConfig
      ? await this.prisma.testInstance.findFirst({
          where: {
            userId,
            examConfigId: testConfigId,
            status: { in: ["CREATED", "IN_PROGRESS"] },
          },
        })
      : await this.testInstanceRepository.findActiveByUser(
          userId,
          testConfigId,
        );

    if (activeTest) {
      await this.prisma.testInstance.update({
        where: { id: activeTest.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
    }

    // Attempt Limit – use configurable maxAttempts from ruleFlags if available, otherwise default 3
    const maxAttempts: number =
      isExamConfig && config.ruleFlags?.maxAttempts != null
        ? config.ruleFlags.maxAttempts
        : 3;

    const previousAttempts = await this.testInstanceRepository.countAttempts(
      userId,
      testConfigId,
    );

    if (previousAttempts >= maxAttempts) {
      return {
        eligible: false,
        errorCode: "ATTEMPT_LIMIT_REACHED",
        reason: `Maximum attempts (${maxAttempts}) reached for this test`,
      };
    }

    return { eligible: true, isExamConfig, resolvedConfigId: testConfigId };
  }
}
