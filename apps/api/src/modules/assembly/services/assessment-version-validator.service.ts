import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AssemblyStatus } from "@prisma/client";
import { AllocatedSectionDto } from "@intervu/shared";

@Injectable()
export class AssessmentVersionValidatorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates version sequencing, schema layout, and safety constraints.
   */
  async validateRollback(
    assemblyId: string,
    targetVersionNumber: number,
    snapshot: any,
  ): Promise<void> {
    // 1. Validate version sequence constraints
    const latestVersion = await this.prisma.assemblyVersion.findFirst({
      where: { assemblyId },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const currentVersion = latestVersion?.version || 0;
    if (targetVersionNumber < 1 || targetVersionNumber >= currentVersion) {
      throw new BadRequestException(
        `Invalid rollback target version: ${targetVersionNumber}. Current version is ${currentVersion}.`,
      );
    }

    // 2. Validate schema layout
    const sections = snapshot?.sections as AllocatedSectionDto[];
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      throw new BadRequestException(
        "Rollback failed: Snapshot sections layout is missing or empty.",
      );
    }

    for (const section of sections) {
      if (!section.sectionKey || !section.displayName) {
        throw new BadRequestException(
          "Rollback failed: Section missing key or display name in snapshot.",
        );
      }
      if (!section.questions || !Array.isArray(section.questions)) {
        throw new BadRequestException(
          `Rollback failed: Section ${section.sectionKey} question count format or array is invalid.`,
        );
      }
    }

    // 3. Rollback Safety Checks
    const assembly = await this.prisma.assembledTest.findUnique({
      where: { id: assemblyId },
    });
    if (!assembly) {
      throw new BadRequestException(
        `Assembly with ID ${assemblyId} not found.`,
      );
    }

    // Block rollback if published and has active candidate sessions
    if (assembly.status === AssemblyStatus.PUBLISHED) {
      const activeSessions = await this.prisma.testInstance.count({
        where: {
          testConfigId: assembly.configId,
          status: "IN_PROGRESS",
        },
      });

      if (activeSessions > 0) {
        throw new BadRequestException(
          `Rollback blocked: Assembly is PUBLISHED and has ${activeSessions} active candidate sessions in progress.`,
        );
      }
    }
  }
}
