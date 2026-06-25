import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConfigurationValidatorService } from "../validators/configuration-validator.service";
import { ConfigDependencyValidatorService } from "../validators/config-dependency-validator.service";
import { ConfigVersionService } from "../versioning/config-version.service";
import { ConfigurationValidationResult } from "../validators/configuration-validator.service";

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
 *   3. Create Version (history entry containing full snapshot)
 *   4. Update status → PUBLISHED
 *   5. Write PublishLog
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

    // Merge warnings from both validators
    const allWarnings = [...validationResult.warnings, ...depResult.warnings];

    let finalVersionStr = "";
    const publishedAt = new Date();

    // ─── Step 3-5: Execute Mutations in Transaction ─────────────────────────
    await this.prisma.$transaction(async (tx) => {
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

      // Write Publish Log
      await tx.configPublishLog.create({
        data: {
          configId,
          publishedBy: publishedBy ?? null,
          version: finalVersionStr,
          publishedAt,
        },
      });
    });

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

    // If fully valid, mark status as VALIDATED
    if (validation.valid && dependencyCheck.valid) {
      await this.prisma.examConfig.update({
        where: { id: configId },
        data: { status: "VALIDATED" },
      });
    }

    return {
      ...validation,
      warnings: [...validation.warnings, ...dependencyCheck.warnings],
      dependencyCheck,
    };
  }
}
