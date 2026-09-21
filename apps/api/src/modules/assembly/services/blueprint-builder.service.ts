import { Injectable, BadRequestException, Inject, Optional } from "@nestjs/common";
import * as crypto from "crypto";
import { BlueprintDto, BlueprintSectionDto } from "@intervu/shared";
import { BlueprintRepository } from "../repositories/blueprint.repository";
import { RedisCacheService } from "../../../cache/redis-cache.service";

@Injectable()
export class BlueprintBuilderService {
  constructor(
    @Inject(BlueprintRepository)
    private readonly blueprintRepository: BlueprintRepository,
    @Optional()
    @Inject(RedisCacheService)
    private readonly redisCacheService?: RedisCacheService,
  ) {}

  async generateBlueprint(configId: string): Promise<BlueprintDto> {
    const t0 = Date.now();
    const cached = this.redisCacheService
      ? await this.redisCacheService.getBlueprint<BlueprintDto>(configId)
      : null;
    if (cached) {
      console.log(`    [BLUEPRINT 💾 HIT] Cached blueprint retrieved in ${Date.now() - t0}ms for ${configId}`);
      return cached;
    }

    const tDb = Date.now();
    const config =
      await this.blueprintRepository.getExamConfigForBlueprint(configId);
    console.log(`    [BLUEPRINT 🗄️ DB] Fetched ExamConfig & sections in ${Date.now() - tDb}ms (Sections: ${config.sections?.length})`);

    if (!config.sections || config.sections.length === 0) {
      throw new BadRequestException(
        `Exam config ${configId} has no sections defined`,
      );
    }

    if (config.difficultyDistribution) {
      const { easyPercentage, mediumPercentage, hardPercentage } =
        config.difficultyDistribution;
      const total = easyPercentage + mediumPercentage + hardPercentage;
      if (total !== 100 && total !== 0) {
        throw new BadRequestException(
          `Difficulty distribution total must equal 100% or 0% (Flexible Pool), got ${total}%`,
        );
      }
    }

    let totalQuestions = 0;
    let totalDurationSeconds = 0;

    const sections: BlueprintSectionDto[] = config.sections.map(
      (section: any, index: number) => {
        let topicAllocations = (section.sectionTopics || []).map((st: any) => {
          const weightage = st.topicWeightage?.weightagePercentage;
          const fallbackPct =
            section.sectionTopics.length > 0
              ? Math.floor(100 / section.sectionTopics.length)
              : 100;
          return {
            topicId: st.topicId,
            percentage: typeof weightage === "number" && weightage > 0 ? weightage : fallbackPct,
          };
        });

        if (topicAllocations.length === 0) {
          topicAllocations = [
            {
              topicId: section.code || section.name || `topic_${index + 1}`,
              percentage: 100,
            },
          ];
        }

        const totalPercentage = topicAllocations.reduce(
          (sum: number, ta: any) => sum + ta.percentage,
          0,
        );
        if (totalPercentage !== 100 && topicAllocations.length > 0) {
          // Normalize to 100%
          const lastIndex = topicAllocations.length - 1;
          const diff = 100 - totalPercentage;
          topicAllocations[lastIndex].percentage += diff;
        }

        totalQuestions += section.questionCount;
        const durationSeconds = (section.sectionDurationMinutes || 15) * 60;
        totalDurationSeconds += durationSeconds;

        return {
          sectionKey: section.code || `section_${index + 1}`,
          displayName: section.name || section.displayName || `Section ${index + 1}`,
          durationSeconds: durationSeconds,
          questionCount: section.questionCount || 5,
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

    const versionHash = this.computeVersionHash(sections, config.difficultyDistribution);

    const blueprint: BlueprintDto = {
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
      versionHash,
    };

    const ttl = parseInt(
      process.env.ASSEMBLY_BLUEPRINT_CACHE_TTL_SECONDS || "3600",
      10,
    );
    if (this.redisCacheService) {
      await this.redisCacheService.setBlueprint(configId, blueprint, ttl);
    }

    return blueprint;
  }

  /**
   * Deterministic content hash over the fields that determine what a
   * pre-generated pool instance actually looks like. Anything cosmetic
   * (display names) is intentionally excluded — only changes that affect
   * question selection should invalidate pre-generated content.
   */
  private computeVersionHash(
    sections: BlueprintSectionDto[],
    difficultyDistribution?: { easyPercentage: number; mediumPercentage: number; hardPercentage: number } | null,
  ): string {
    const stableSections = sections
      .map((s) => ({
        sectionKey: s.sectionKey,
        questionCount: s.questionCount,
        durationSeconds: s.durationSeconds,
        topicAllocations: [...s.topicAllocations]
          .map((t) => ({ topicId: t.topicId, percentage: t.percentage }))
          .sort((a, b) => a.topicId.localeCompare(b.topicId)),
      }))
      .sort((a, b) => a.sectionKey.localeCompare(b.sectionKey));

    const payload = JSON.stringify({ sections: stableSections, difficultyDistribution: difficultyDistribution ?? null });
    return crypto.createHash("sha256").update(payload).digest("hex");
  }
}
