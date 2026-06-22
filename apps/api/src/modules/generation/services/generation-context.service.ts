import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { GenerationContextDto, SectionDto, TopicDto, TemplateDto } from "../dto/generation.dto";

@Injectable()
export class GenerationContextService {
  constructor(private readonly prismaService: PrismaService) {}

  async loadContext(examId: string): Promise<GenerationContextDto> {
    // 1. Fetch Exam Config with all dependencies
    const examConfig = await this.prismaService.examConfig.findUnique({
      where: { id: examId },
      include: {
        difficultyDistribution: true,
        sections: {
          include: {
            sectionTopics: {
              include: {
                topic: {
                  include: {
                    concepts: {
                      where: {
                        status: "ACTIVE",
                      },
                    },
                  },
                },
                topicWeightage: true,
              },
            },
          },
        },
      },
    });

    if (!examConfig) {
      throw new NotFoundException({
        success: false,
        error: {
          code: "CONFIG_MISSING",
          message: `Exam config with ID ${examId} not found`,
        },
      });
    }

    // 2. Validation Rule: Reject when no section exists
    if (!examConfig.sections || examConfig.sections.length === 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "INVALID_CONFIG",
          message: "No sections configured for this exam configuration",
        },
      });
    }

    // 3. Validation Rule: Reject when invalid difficulty distribution
    const dist = examConfig.difficultyDistribution;
    if (!dist) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "INVALID_CONFIG",
          message: "Difficulty distribution configuration is missing for this exam",
        },
      });
    }

    const totalDifficulty = dist.easyPercentage + dist.mediumPercentage + dist.hardPercentage;
    if (totalDifficulty !== 100) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "INVALID_CONFIG",
          message: `Difficulty distribution must total exactly 100% (currently ${totalDifficulty}%)`,
        },
      });
    }

    // 4. Resolve Sections DTO
    const sectionDtos: SectionDto[] = examConfig.sections.map((s) => ({
      id: s.id,
      name: s.name,
      questionCount: s.questionCount,
      durationMinutes: s.sectionDurationMinutes,
      orderIndex: s.sectionOrder,
      code: s.code,
    }));

    // 5. Resolve Topics & Concepts DTO
    const topicDtos: TopicDto[] = [];
    const topicIds = new Set<string>();
    const conceptKeys = new Set<string>();

    for (const section of examConfig.sections) {
      for (const sectionTopic of section.sectionTopics) {
        const t = sectionTopic.topic;
        if (t.status !== "ACTIVE") continue;

        if (!topicIds.has(t.id)) {
          topicIds.add(t.id);
          const conceptCodes = t.concepts.map((c: any) => c.code);
          conceptCodes.forEach((code: string) => conceptKeys.add(code));

          topicDtos.push({
            id: t.id,
            name: t.name,
            code: t.code,
            conceptCodes,
            weightagePercentage: sectionTopic.topicWeightage?.weightagePercentage,
          });
        }
      }
    }

    // Validation Rule: Reject when no active topics exist
    if (topicDtos.length === 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "INVALID_CONFIG",
          message: "No active topics configured for the sections of this exam configuration",
        },
      });
    }

    // 6. Resolve Templates & Validation Rules (Reject when template missing/inactive)
    if (conceptKeys.size === 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "INVALID_CONFIG",
          message: "No concepts mapped to configured topics",
        },
      });
    }

    const templates = await this.prismaService.template.findMany({
      where: {
        conceptKey: { in: Array.from(conceptKeys) },
        isActive: true,
        deletedAt: null,
      },
    });

    if (templates.length === 0) {
      throw new NotFoundException({
        success: false,
        error: {
          code: "TEMPLATE_MISSING",
          message: "No active templates found for the configured topics and difficulty levels",
        },
      });
    }

    const templateDtos: TemplateDto[] = templates.map((t) => ({
      id: t.id,
      templateKey: t.templateKey,
      conceptKey: t.conceptKey,
      difficultyLevel: t.difficultyLevel,
      questionType: t.questionType,
      version: t.version,
      isActive: t.isActive,
      variableSchema: t.variableSchema,
      constraints: t.constraints,
      solutionSchema: t.solutionSchema,
    }));

    return {
      examId,
      sections: sectionDtos,
      topics: topicDtos,
      templates: templateDtos,
      difficultyDistribution: {
        easy: dist.easyPercentage,
        medium: dist.mediumPercentage,
        hard: dist.hardPercentage,
      },
    };
  }
}
