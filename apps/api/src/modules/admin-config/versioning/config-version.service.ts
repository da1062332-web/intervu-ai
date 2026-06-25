import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { FullExamConfig } from "../types";

export interface ConfigVersionEntry {
  id: string;
  configId: string;
  versionNumber: number;
  snapshot: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Task Group 2 — Config Versioning Engine
 *
 * Tracks configuration history using the existing ExamConfigVersion table.
 * Version format: v1, v2, v3 ...
 *
 * APIs:
 *  POST /api/v1/configs/:id/version      → createVersion
 *  GET  /api/v1/configs/:id/versions     → getVersions
 *  POST /api/v1/configs/:id/restore/:vid → restoreVersion
 */
@Injectable()
export class ConfigVersionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new version entry with the full config snapshot.
   * Automatically increments the version number.
   */
  async createVersion(
    config: FullExamConfig,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx?: any, // Optional prisma transaction client
  ): Promise<ConfigVersionEntry> {
    const prismaClient = tx || this.prisma;

    // Determine next version number
    const latest = await prismaClient.examConfigVersion.findFirst({
      where: { examConfigId: config.id },
      orderBy: { versionNumber: "desc" },
    });

    const nextVersionNumber = latest ? latest.versionNumber + 1 : 1;

    // The snapshot is the complete configuration graph
    const version = await prismaClient.examConfigVersion.create({
      data: {
        examConfigId: config.id,
        versionNumber: nextVersionNumber,
        snapshot: config as unknown as object,
      },
    });

    return this.mapToEntry(version);
  }

  /**
   * Helper to fetch the full graph and create a version.
   * Useful for manual version creation endpoints.
   */
  async createVersionFromId(configId: string): Promise<ConfigVersionEntry> {
    const config = await this.prisma.examConfig.findUnique({
      where: { id: configId },
      include: {
        sections: {
          include: {
            sectionTopics: {
              include: {
                topic: {
                  include: {
                    concepts: true,
                  },
                },
              },
            },
          },
        },
        difficultyDistribution: true,
        ruleFlags: true,
      },
    });

    if (!config) {
      throw new NotFoundException(
        `Exam configuration with ID "${configId}" not found`,
      );
    }

    return this.createVersion(config);
  }

  /**
   * List all versions for a config in descending order.
   */
  async getVersions(configId: string): Promise<ConfigVersionEntry[]> {
    const config = await this.prisma.examConfig.findUnique({
      where: { id: configId },
    });
    if (!config) {
      throw new NotFoundException(
        `Exam configuration with ID "${configId}" not found`,
      );
    }

    const versions = await this.prisma.examConfigVersion.findMany({
      where: { examConfigId: configId },
      orderBy: { versionNumber: "desc" },
    });

    return versions.map((v) => this.mapToEntry(v));
  }

  /**
   * Restore a config to a previous version's snapshot.
   * Updates the exam config and its related entities from the snapshot.
   */
  async restoreVersion(
    configId: string,
    versionId: string,
  ): Promise<{ message: string; versionNumber: number }> {
    const config = await this.prisma.examConfig.findUnique({
      where: { id: configId },
    });
    if (!config) {
      throw new NotFoundException(
        `Exam configuration with ID "${configId}" not found`,
      );
    }

    if (config.isArchived || config.status === "ARCHIVED") {
      throw new BadRequestException({
        code: "CONFIG_ARCHIVED",
        message: "Cannot restore an archived configuration",
      });
    }

    const version = await this.prisma.examConfigVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.examConfigId !== configId) {
      throw new NotFoundException(
        `Version "${versionId}" not found for config "${configId}"`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snapshot = version.snapshot as any;

    await this.prisma.$transaction(async (tx) => {
      // 1. Delete existing relations
      await tx.examSection.deleteMany({ where: { examConfigId: configId } });
      await tx.difficultyDistribution.deleteMany({
        where: { examConfigId: configId },
      });
      await tx.ruleFlags.deleteMany({ where: { examConfigId: configId } });

      // 2. Restore basic fields
      await tx.examConfig.update({
        where: { id: configId },
        data: {
          name: snapshot.name ?? config.name,
          role: snapshot.role ?? config.role,
          description: snapshot.description ?? config.description,
          durationMinutes: snapshot.durationMinutes ?? config.durationMinutes,
          totalQuestions: snapshot.totalQuestions ?? config.totalQuestions,
          status: "DRAFT",
        },
      });

      // 3. Restore difficulty distribution
      if (snapshot.difficultyDistribution) {
        await tx.difficultyDistribution.create({
          data: {
            examConfigId: configId,
            easyPercentage: snapshot.difficultyDistribution.easyPercentage,
            mediumPercentage: snapshot.difficultyDistribution.mediumPercentage,
            hardPercentage: snapshot.difficultyDistribution.hardPercentage,
          },
        });
      }

      // 4. Restore rule flags
      if (snapshot.ruleFlags) {
        await tx.ruleFlags.create({
          data: {
            examConfigId: configId,
            negativeMarkingEnabled: snapshot.ruleFlags.negativeMarkingEnabled,
            sectionalCutoffEnabled: snapshot.ruleFlags.sectionalCutoffEnabled,
            adaptiveDifficultyEnabled:
              snapshot.ruleFlags.adaptiveDifficultyEnabled,
            shuffleQuestionsEnabled: snapshot.ruleFlags.shuffleQuestionsEnabled,
            shuffleOptionsEnabled: snapshot.ruleFlags.shuffleOptionsEnabled,
            allowSectionNavigation: snapshot.ruleFlags.allowSectionNavigation,
          },
        });
      }

      // 5. Restore sections and topics
      if (snapshot.sections && Array.isArray(snapshot.sections)) {
        for (const section of snapshot.sections) {
          await tx.examSection.create({
            data: {
              examConfigId: configId,
              name: section.name,
              code: section.code,
              questionCount: section.questionCount,
              isRequired: section.isRequired ?? true,
              sectionDurationMinutes: section.sectionDurationMinutes ?? 0,
              sectionOrder: section.sectionOrder ?? 0,
              sectionTopics: {
                create:
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  section.sectionTopics?.map((st: any) => ({
                    topicId: st.topicId,
                    topicWeightage: st.topicWeightage
                      ? {
                          create: {
                            weightagePercentage:
                              st.topicWeightage.weightagePercentage,
                          },
                        }
                      : undefined,
                  })) || [],
              },
            },
          });
        }
      }
    });

    return {
      message: `Configuration restored to v${version.versionNumber}. Status reset to DRAFT — please re-validate before publishing.`,
      versionNumber: version.versionNumber,
    };
  }

  private mapToEntry(version: {
    id: string;
    examConfigId: string;
    versionNumber: number;
    snapshot: unknown;
    createdAt: Date;
  }): ConfigVersionEntry {
    return {
      id: version.id,
      configId: version.examConfigId,
      versionNumber: version.versionNumber,
      snapshot: version.snapshot as Record<string, unknown>,
      createdAt: version.createdAt,
    };
  }
}
