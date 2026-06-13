import { Injectable, BadRequestException } from "@nestjs/common";
import { BlueprintDto, BlueprintSectionDto } from "./dto/blueprint.dto";
import { TestSection } from "@prisma/client";
import { TestConfigRepository } from "../tests/repositories/test-config.repository";

@Injectable()
export class BlueprintBuilderService {
  constructor(private readonly testConfigRepository: TestConfigRepository) {}

  async generateBlueprint(configId: string): Promise<BlueprintDto> {
    const config =
      await this.testConfigRepository.findByIdWithSections(configId);

    if (!config) {
      throw new BadRequestException(
        `Test configuration with ID ${configId} not found`,
      );
    }

    if (!config.sections || config.sections.length === 0) {
      throw new BadRequestException(
        `Test configuration ${configId} has no sections defined`,
      );
    }

    // Sort sections by orderIndex (previously done in Prisma query)
    const sortedSections = [...config.sections].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    );

    const sections: BlueprintSectionDto[] = sortedSections.map(
      (section: TestSection) => ({
        sectionKey: section.sectionKey,
        displayName: section.displayName,
        durationSeconds: section.durationSeconds,
        questionCount: section.questionCount,
        orderIndex: section.orderIndex,
      }),
    );

    return {
      testConfigId: config.id,
      totalQuestions: config.totalQuestions,
      totalDurationSeconds: config.totalDurationSeconds,
      sections,
    };
  }
}
