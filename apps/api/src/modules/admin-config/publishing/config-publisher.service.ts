import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConfigurationValidatorService } from "../validators/configuration-validator.service";
import { ConfigDependencyValidatorService } from "../validators/config-dependency-validator.service";
import { ConfigVersionService } from "../versioning/config-version.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { ConfigurationValidationResult } from "../validators/configuration-validator.service";

import { ExamConfigReadinessService } from "../services/exam-config-readiness.service";

export interface PublishResult {
  configId: string;
  status: string;
  version: string;
  publishedAt: Date;
  validation: ConfigurationValidationResult;
}

/**
 * Task Group 4 — Config Publishing Engine
 *
 * Orchestrates the full publish flow:
 *   1. Validate (blocks if invalid)
 *   2. Validate Dependencies
 *   3. Enforce 100% Readiness Gate (blocks if score < 100%)
 *   4. Create Version (history entry containing full snapshot)
 *   5. Update status → PUBLISHED
 *   6. Write PublishLog
 *
 * Execution is wrapped in a Prisma $transaction for safety.
 * Only DRAFT or VALIDATED configs can be published.
 * ARCHIVED configs are blocked.
 */
@Injectable()
export class ConfigPublisherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: ConfigurationValidatorService,
    private readonly dependencyValidator: ConfigDependencyValidatorService,
    private readonly versionService: ConfigVersionService,
    private readonly readinessService: ExamConfigReadinessService,
    private readonly cacheService: RedisCacheService,
  ) {}

  async publish(
    configId: string,
    publishedBy?: string,
  ): Promise<PublishResult> {
    // ─── Pre-flight check & Fetch Graph ───────────────────────────────────────
    // Fetch once to avoid N+1 queries in validators and snapshot creation.
    const config = await this.prisma.examConfig.findUnique({
      where: { id: configId },
      include: {
        sections: {
          include: {
            sectionTopics: {
              include: {
                topicWeightage: true,
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

    if (config.isArchived || config.status === "ARCHIVED") {
      throw new BadRequestException({
        code: "CONFIG_ARCHIVED",
        message: "Archived configurations cannot be published",
      });
    }

    // ─── Step 1: Validate ─────────────────────────────────────────────────────
    const validationResult = await this.validator.validate(config);

    if (!validationResult.valid) {
      throw new BadRequestException({
        code: "CONFIG_INVALID",
        message:
          "Configuration validation failed — fix errors before publishing",
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      });
    }

    // ─── Step 2: Dependency Validation ───────────────────────────────────────
    const depResult =
      await this.dependencyValidator.validateDependencies(config);

    if (!depResult.valid) {
      throw new BadRequestException({
        code: "DEPENDENCY_INVALID",
        message:
          "Dependency validation failed — resolve dependency issues before publishing",
        errors: depResult.errors,
        warnings: depResult.warnings,
      });
    }

    // ─── Step 3: Readiness Gate (100% Score Enforcement) ─────────────────────
    const readinessResult =
      await this.readinessService.checkReadiness(configId);

    if (readinessResult.score < 100 || readinessResult.status !== "READY") {
      const failedChecks = readinessResult.checks
        .filter((c) => c.status !== "PASS")
        .map((c) => `${c.name}: ${c.message}`);

      throw new BadRequestException({
        code: "READINESS_GATE_FAILED",
        message: `Publish blocked — Readiness score is ${readinessResult.score}% (must be 100% READY)`,
        score: readinessResult.score,
        status: readinessResult.status,
        errors: failedChecks,
        warnings: [],
      });
    }

    // Merge warnings from both validators
    const allWarnings = [...validationResult.warnings, ...depResult.warnings];

    let finalVersionStr = "";
    const publishedAt = new Date();

    // ─── Step 3-5: Execute Mutations in Transaction ─────────────────────────
    await this.prisma.$transaction(
      async (tx) => {
        // Auto-generate Blueprint shell if missing to break circular deadlock & ensure readiness
        await this.autoEnsureBlueprint(tx, config);

        // Create version using the pre-fetched graph
        const versionEntry = await this.versionService.createVersion(config, tx);
        finalVersionStr = `v${versionEntry.versionNumber}`;

        // Update status → PUBLISHED
        await tx.examConfig.update({
          where: { id: configId },
          data: {
            status: "PUBLISHED",
            isActive: true,
          },
        });

        // ─── Cascade Publish to AssembledTest ──────────────────────────────────
        try {
          await tx.assembledTest.updateMany({
            where: { configId, status: { not: "PUBLISHED" } },
            data: { status: "PUBLISHED" },
          });
        } catch (assemblyErr) {
          console.warn(
            `[ConfigPublisher] Could not cascade PUBLISHED status to AssembledTest for configId ${configId}:`,
            assemblyErr,
          );
        }

        // Write Publish Log
        await tx.configPublishLog.create({
          data: {
            configId,
            publishedBy: publishedBy ?? null,
            version: finalVersionStr,
            publishedAt,
          },
        });
      },
      { timeout: 30000, maxWait: 10000 },
    );

    await this.cacheService.delete("dashboard:examConfigs:available:v2");

    return {
      configId,
      status: "PUBLISHED",
      version: finalVersionStr,
      publishedAt,
      validation: {
        valid: true,
        errors: [],
        warnings: allWarnings,
      },
    };
  }

  /**
   * Validate-only endpoint — marks config as VALIDATED without publishing.
   * Returns validation result so admin can review before committing to publish.
   */
  async validateOnly(configId: string): Promise<
    ConfigurationValidationResult & {
      dependencyCheck: ConfigurationValidationResult;
    }
  > {
    const config = await this.prisma.examConfig.findUnique({
      where: { id: configId },
      include: {
        sections: {
          include: {
            sectionTopics: {
              include: {
                topicWeightage: true,
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

    const [validation, dependencyCheck] = await Promise.all([
      this.validator.validate(config),
      this.dependencyValidator.validateDependencies(config),
    ]);

    // If fully valid, mark status as VALIDATED and ensure blueprint exists
    if (validation.valid && dependencyCheck.valid) {
      await this.prisma.examConfig.update({
        where: { id: configId },
        data: { status: "VALIDATED" },
      });
      try {
        await this.autoEnsureBlueprint(this.prisma, config);
      } catch (err) {
        console.warn("Auto-ensure blueprint notice in validateOnly:", err);
      }
    }

    return {
      ...validation,
      warnings: [...validation.warnings, ...dependencyCheck.warnings],
      dependencyCheck,
    };
  }

  private async autoEnsureBlueprint(tx: any, config: any) {
    const existingBp = await tx.blueprint.findUnique({
      where: { configId: config.id },
    });

    if (existingBp) return existingBp;

    let styleProfile = await tx.styleProfile.findFirst({
      where: { status: "ACTIVE", active: true },
    });

    if (!styleProfile) {
      styleProfile = await tx.styleProfile.create({
        data: {
          name: "Default Standard Profile",
          profileType: "DEFAULT",
          status: "ACTIVE",
          active: true,
        },
      });
    }

    const diffAlloc = config.difficultyDistribution
      ? {
          easy: config.difficultyDistribution.easyPercentage ?? 0,
          medium: config.difficultyDistribution.mediumPercentage ?? 0,
          hard: config.difficultyDistribution.hardPercentage ?? 0,
        }
      : { easy: 0, medium: 0, hard: 0 };

    const bpSections = (config.sections || []).map((section: any) => ({
      sectionId: section.id,
      sectionKey: section.sectionKey || section.id,
      displayName: section.name,
      questionCount: section.questionCount || 5,
      difficultyAllocation: diffAlloc,
      topicAllocations: (section.sectionTopics || []).map((st: any) => ({
        topicId: st.topicId,
        percentage: Math.round(100 / (section.sectionTopics?.length || 1)),
      })),
    }));

    return tx.blueprint.create({
      data: {
        configId: config.id,
        styleProfileId: styleProfile.id,
        sections: bpSections as any,
      },
    });
  }
}
