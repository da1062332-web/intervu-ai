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
   */
  async getAvailableConfigs(): Promise<TestConfigsResponseDto> {
    const testConfigs = await this.testsRepository.findAllActiveConfigs();

    const configs: AvailableConfigDto[] = testConfigs.map((tc) => {
      const isExam = tc.isExam;
      const rawSections = tc.sections || [];

      const mappedSections = isExam
        ? rawSections.map((s: any, idx: number) => ({
            id: s.id || `section-${idx}`,
            name: s.name,
            questionCount: s.questionCount || 0,
            durationMinutes: s.sectionDurationMinutes || 0,
          }))
        : rawSections.map((s: any, idx: number) => ({
            id: s.id || `section-${idx}`,
            name: s.displayName,
            questionCount: s.questionCount || 0,
            durationMinutes: s.durationSeconds
              ? Math.floor(s.durationSeconds / 60)
              : 0,
          }));

      const sumSectionMins = mappedSections.reduce(
        (sum: number, s: any) => sum + (s.durationMinutes || 0),
        0,
      );
      const sumSectionQs = mappedSections.reduce(
        (sum: number, s: any) => sum + (s.questionCount || 0),
        0,
      );

      const totalDurationMins =
        sumSectionMins > 0
          ? sumSectionMins
          : isExam
            ? tc.durationMinutes || 0
            : Math.floor((tc.totalDurationSeconds || 0) / 60);

      const totalQuestions =
        sumSectionQs > 0 ? sumSectionQs : tc.totalQuestions || 0;

      return {
        configId: tc.id,
        company: isExam ? "Intervu" : tc.companyName || "Platform Assessment",
        name: isExam ? tc.name : tc.displayName,
        difficulty: tc.difficulty || "MEDIUM",
        duration: totalDurationMins * 60,
        durationMinutes: totalDurationMins,
        sections: mappedSections as any,
        questionCount: totalQuestions,
      };
    });

    return { configs };
  }
}
