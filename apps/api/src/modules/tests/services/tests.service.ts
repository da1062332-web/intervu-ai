import { Injectable } from "@nestjs/common";
import { TestsRepository } from "../repositories/tests.repository";
// eslint-disable-next-line no-restricted-imports
import {
  AvailableConfigDto,
  TemplateConfig,
  TestConfigsResponseDto,
} from "../dto/available-config.dto";

@Injectable()
export class TestsService {
  constructor(private readonly testsRepository: TestsRepository) {}

  /**
   * Returns all active assessment configurations available to candidates.
   *
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   *
   * Template.config is Json (no DB schema) — all keys accessed defensively
   * via the TemplateConfig interface with optional fields.
   */
  async getAvailableConfigs(): Promise<TestConfigsResponseDto> {
    // 1. validate — no input required for this read-only discovery endpoint

    // 2. fetchDependencies
    const testConfigs = await this.testsRepository.findAllActiveConfigs();

    // 3. coreLogic — map TestConfig rows to AvailableConfigDto
    const configs: AvailableConfigDto[] = testConfigs.map((tc) => {
      return {
        configId: tc.id,
        company: tc.companyName,
        name: tc.displayName,
        difficulty: "MEDIUM",
        duration: tc.totalDurationSeconds,
        sections: tc.sections.map((s: any) => s.displayName),
      };
    });

    // 4. formatResponse
    return { configs };
  }
}
