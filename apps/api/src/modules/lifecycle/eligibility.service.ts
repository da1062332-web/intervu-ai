import { Injectable } from "@nestjs/common";
import { UserRepository } from "../users/repositories/user.repository";
import { TestConfigRepository } from "../tests/repositories/test-config.repository";
import { TestInstanceRepository } from "../tests/test-instance/test-instance.repository";

export interface EligibilityResult {
  eligible: boolean;
  errorCode?: string;
  reason?: string;
}

@Injectable()
export class EligibilityService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly testConfigRepository: TestConfigRepository,
    private readonly testInstanceRepository: TestInstanceRepository,
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
    const config = await this.testConfigRepository.findById(testConfigId);

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

    // Validate Active Test Limit (User shouldn't have an ongoing test for the same config)
    const activeTest = await this.testInstanceRepository.findActiveByUser(
      userId,
      testConfigId,
    );

    if (activeTest) {
      return {
        eligible: false,
        errorCode: "ACTIVE_TEST_EXISTS",
        reason: "You already have an active instance of this test",
      };
    }

    // Attempt Limit
    const previousAttempts = await this.testInstanceRepository.countAttempts(
      userId,
      testConfigId,
    );

    // MVP default max 3 attempts
    if (previousAttempts >= 3) {
      return {
        eligible: false,
        errorCode: "ATTEMPT_LIMIT_REACHED",
        reason: "Maximum attempts reached for this test",
      };
    }

    return { eligible: true };
  }
}
