import { Injectable } from "@nestjs/common";
import { TestsRepository } from "../repositories/tests.repository";

import {
  AvailableConfigDto,
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
        company: tc.isExam ? "Intervu" : tc.companyName,
        name: tc.isExam ? tc.name : tc.displayName,
        difficulty: "MEDIUM",
        duration: tc.isExam ? tc.durationMinutes * 60 : tc.totalDurationSeconds,
        sections: tc.isExam 
          ? tc.sections.map((s: { name: string }) => s.name)
          : tc.sections.map((s: { displayName: string }) => s.displayName),
        questionCount: tc.isExam ? tc.totalQuestions : 0,
      };
    });

    // 4. formatResponse
    return { configs };
  }
}
