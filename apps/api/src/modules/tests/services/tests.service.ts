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
    const templates = await this.testsRepository.findAllActiveTemplates();

    // 3. coreLogic — map Template rows to AvailableConfigDto
    const configs: AvailableConfigDto[] = templates.map((template) => {
      const config = template.config as TemplateConfig;
      return {
        configId: template.id,
        company: config.company ?? "",
        name: template.name,
        difficulty: template.difficulty,
        // Template.config.durationSeconds — 0 when not configured
        duration: config.durationSeconds ?? 0,
        // Template.config.sections — empty array when not configured
        sections: config.sections ?? [],
      };
    });

    // 4. formatResponse
    return { configs };
  }
}
