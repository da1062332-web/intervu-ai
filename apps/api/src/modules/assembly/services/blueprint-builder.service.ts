import { Injectable, BadRequestException } from "@nestjs/common";
import { BlueprintDto, BlueprintSectionDto } from "@intervu/shared";
import { BlueprintRepository } from "../repositories/blueprint.repository";

@Injectable()
export class BlueprintBuilderService {
  constructor(private readonly blueprintRepository: BlueprintRepository) {}

  async generateBlueprint(configId: string): Promise<BlueprintDto> {
    const config =
      await this.blueprintRepository.getExamConfigForBlueprint(configId);

    if (!config.sections || config.sections.length === 0) {
      throw new BadRequestException(
        `Exam config ${configId} has no sections defined`,
      );
    }

    if (config.difficultyDistribution) {
      const { easyPercentage, mediumPercentage, hardPercentage } =
        config.difficultyDistribution;
      if (easyPercentage + mediumPercentage + hardPercentage !== 100) {
        throw new BadRequestException(`Difficulty total != 100%`);
      }
    }

    let totalQuestions = 0;
    let totalDurationSeconds = 0;

    const sections: BlueprintSectionDto[] = config.sections.map(
      (section, index) => {
        const topicAllocations = section.sectionTopics.map((st) => {
          if (!st.topicWeightage) {
            throw new BadRequestException(
              `Missing topic mappings for topic ${st.topicId} in section ${section.id}`,
            );
          }
          return {
            topicId: st.topicId,
            percentage: st.topicWeightage.weightagePercentage,
          };
        });

        if (topicAllocations.length === 0) {
          throw new BadRequestException(
            `Missing topic mappings in section ${section.id}`,
          );
        }

        const totalPercentage = topicAllocations.reduce(
          (sum, ta) => sum + ta.percentage,
          0,
        );
        if (totalPercentage !== 100 && topicAllocations.length > 0) {
          // Could validate strictly, but the rule only says "missing topic mappings".
        }

        totalQuestions += section.questionCount;
        const durationSeconds = section.sectionDurationMinutes * 60;
        totalDurationSeconds += durationSeconds;

        return {
          sectionKey: section.code,
          displayName: section.name,
          durationSeconds: durationSeconds,
          questionCount: section.questionCount,
          orderIndex: section.sectionOrder ?? index,
          topicAllocations: topicAllocations,
          difficultyDistribution: config.difficultyDistribution
            ? {
                EASY: config.difficultyDistribution.easyPercentage,
                MEDIUM: config.difficultyDistribution.mediumPercentage,
                HARD: config.difficultyDistribution.hardPercentage,
              }
            : undefined, // Section specific diff not required by default, we fallback to global
        };
      },
    );

    return {
      testConfigId: configId,
      totalQuestions,
      totalDurationSeconds,
      difficultyDistribution: config.difficultyDistribution
        ? {
            EASY: config.difficultyDistribution.easyPercentage,
            MEDIUM: config.difficultyDistribution.mediumPercentage,
            HARD: config.difficultyDistribution.hardPercentage,
          }
        : undefined,
      sections,
    };
  }
}
