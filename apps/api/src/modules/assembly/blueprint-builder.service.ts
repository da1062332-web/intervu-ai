import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { BlueprintDto, BlueprintSectionDto } from "./dto/blueprint.dto";
import { TestSection } from "@prisma/client";

@Injectable()
export class BlueprintBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  async generateBlueprint(configId: string): Promise<BlueprintDto> {
    const config = await this.prisma.testConfig.findUnique({
      where: { id: configId },
      include: { sections: { orderBy: { orderIndex: "asc" } } },
    });

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

    const sections: BlueprintSectionDto[] = config.sections.map(
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
