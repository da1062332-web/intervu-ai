import { Injectable, Optional } from "@nestjs/common";
import { UserRepository } from "../users/repositories/user.repository";
import { TestConfigRepository } from "../tests/repositories/test-config.repository";
import { TestInstanceRepository } from "../tests/test-instance/test-instance.repository";
import { PrismaService } from "../../prisma/prisma.service";
import { EntitlementService } from "../billing/services/entitlement.service";

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
    @Optional() private readonly entitlementService?: EntitlementService,
  ) {}

  private async isVipUser(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, role: true },
      });
      if (!user) return false;
      const email = user.email?.toLowerCase().trim();
      return email === "candidate@intervu.ai" || email === "admin@intervu.ai";
    } catch {
      return false;
    }
  }

  async validateEligibility(
    userId: string,
    testConfigId: string,
  ): Promise<EligibilityResult> {
    const isVip = await this.isVipUser(userId);

    // 1. Validate User Subscription Plan & Entitlements (bypassed for VIP / Test accounts)
    if (!isVip && this.entitlementService) {
      let entitlements = null;
      try {
        entitlements = await this.entitlementService.getUserEntitlements(userId);
      } catch {}

      if (!entitlements || !entitlements.hasActivePlan) {
        return {
          eligible: false,
          errorCode: "NO_ACTIVE_PLAN",
          reason: "An active subscription plan is required to start this assessment. Please choose a plan to continue.",
        };
      }
    }

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
      const isPlayableStatus =
        config.status === "PUBLISHED" ||
        config.status === "ACTIVE" ||
        config.status === "VALIDATED";

      if (!isPlayableStatus) {
        // Check if candidate has an explicit allowed_assessments quota override
        const explicitOverride = await this.prisma.userQuotaOverride.findFirst({
          where: {
            userId,
            featureKey: { in: ["allowed_assessments", "allowedAssessments"] },
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        });
        const isAllowedByOverride = (() => {
          if (!explicitOverride) return false;
          const val = explicitOverride.overrideValue as any;
          const list = Array.isArray(val)
            ? val
            : Array.isArray(val?.assessments)
              ? val.assessments
              : [];
          return (
            list.includes(config.id) || (config.code && list.includes(config.code))
          );
        })();

        if (!isAllowedByOverride) {
          return {
            eligible: false,
            errorCode: "TEST_NOT_PUBLISHED",
            reason: "This assessment is not published and is unavailable.",
          };
        }
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

    // Attempt Limit – check plan override first, then ruleFlags from config, default 3
    let effectiveMaxAttempts: number =
      isExamConfig && config.ruleFlags?.maxAttempts != null
        ? config.ruleFlags.maxAttempts
        : 3;

    if (this.entitlementService) {
      try {
        const entitlements = await this.entitlementService.getUserEntitlements(userId);
        const features = (entitlements?.features as any) || {};
        const allowedAssessmentsVal = features.allowedAssessments || features.allowed_assessments;

        if (allowedAssessmentsVal) {
          let allowedList: string[] | null = null;
          if (typeof allowedAssessmentsVal === "object" && !Array.isArray(allowedAssessmentsVal)) {
            if (Array.isArray(allowedAssessmentsVal.assessments)) {
              allowedList = allowedAssessmentsVal.assessments;
            }
            if (typeof allowedAssessmentsVal.attemptsPerExam === "number") {
              effectiveMaxAttempts = allowedAssessmentsVal.attemptsPerExam;
            }
          } else if (Array.isArray(allowedAssessmentsVal)) {
            allowedList = allowedAssessmentsVal;
          }

          if (allowedList && !allowedList.includes("all")) {
            const isAllowed =
              allowedList.includes(testConfigId) ||
              (config.code && allowedList.includes(config.code)) ||
              (config.configKey && allowedList.includes(config.configKey)) ||
              (config.name && allowedList.includes(config.name)) ||
              (config.displayName && allowedList.includes(config.displayName)) ||
              (config.title && allowedList.includes(config.title));
            if (!isAllowed) {
              return {
                eligible: false,
                errorCode: "ASSESSMENT_NOT_IN_PLAN",
                reason: "This assessment is not included in your active subscription plan.",
              };
            }
          }
        }
      } catch {}
    }

    if (isVip) {
      return { eligible: true, isExamConfig, resolvedConfigId: testConfigId };
    }

    const previousAttempts = await this.testInstanceRepository.countAttempts(
      userId,
      testConfigId,
    );

    if (previousAttempts >= effectiveMaxAttempts) {
      return {
        eligible: false,
        errorCode: "ATTEMPT_LIMIT_REACHED",
        reason: `Maximum attempts (${effectiveMaxAttempts}) reached for this test`,
      };
    }

    return { eligible: true, isExamConfig, resolvedConfigId: testConfigId };
  }
}
