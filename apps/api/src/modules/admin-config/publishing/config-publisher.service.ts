import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  Optional,
  forwardRef,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConfigurationValidatorService } from "../validators/configuration-validator.service";
import { ConfigDependencyValidatorService } from "../validators/config-dependency-validator.service";
import { ConfigVersionService } from "../versioning/config-version.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { ConfigurationValidationResult } from "../validators/configuration-validator.service";
import { ExamConfigReadinessService } from "../services/exam-config-readiness.service";
import { TestPoolManagerService } from "../../assembly/services/test-pool-manager.service";

import * as crypto from "crypto";
import { CandidateDashboardRepository } from "../../candidate/repositories/candidate-dashboard.repository";
import { PublicTestsService } from "../../candidate/services/public-tests.service";

export interface PublishResult {
  configId: string;
  status: string;
  version: string;
  versionNumber: number;
  publishedVersionId: string;
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
 *   4. Create Immutable ExamPublishedVersion with frozen sections & questions
 *   5. Supersede previous active versions
 *   6. Update ExamConfig status → PUBLISHED, activeVersionId, currentVersionNumber
 *   7. Cascade status to AssembledTest & write PublishLog
 *   8. Evict all candidate dashboard caches
 *
 * Execution is wrapped in a Prisma $transaction for safety.
 * Only DRAFT or VALIDATED configs can be published.
 * ARCHIVED configs are blocked.
 */
@Injectable()
export class ConfigPublisherService {
  private readonly logger = new Logger(ConfigPublisherService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigurationValidatorService)
    private readonly validator: ConfigurationValidatorService,
    @Inject(ConfigDependencyValidatorService)
    private readonly dependencyValidator: ConfigDependencyValidatorService,
    @Inject(ConfigVersionService)
    private readonly versionService: ConfigVersionService,
    @Inject(ExamConfigReadinessService)
    private readonly readinessService: ExamConfigReadinessService,
    @Inject(RedisCacheService)
    private readonly cacheService: RedisCacheService,
    @Optional()
    @Inject(forwardRef(() => TestPoolManagerService))
    private readonly testPoolManager?: TestPoolManagerService,
  ) {}

  async publish(
    configId: string,
    publishedBy?: string,
  ): Promise<PublishResult> {
    // ─── Pre-flight check & Fetch Full Graph ─────────────────────────────────
    const config = await this.prisma.examConfig.findUnique({
      where: { id: configId },
      include: {
        sections: {
          orderBy: { sectionOrder: "asc" },
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
            questions: {
              include: {
                questionMedia: {
                  include: {
                    mediaAsset: true,
                  },
                  orderBy: { position: "asc" },
                },
              },
            },
          },
        },
        difficultyDistribution: true,
        ruleFlags: true,
        hiringEvaluationConfig: {
          include: {
            sectionMappings: true,
          },
        },
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

    const publishedAt = new Date();
    let createdPublishedVersionId = "";
    let finalVersionNumber = 1;
    let finalVersionName = "";

    // ─── Step 4-5: Execute Atomic Version Creation in Transaction ────────────
    await this.prisma.$transaction(
      async (tx) => {
        // Auto-generate Blueprint shell if missing to break circular deadlock & ensure readiness
        await this.autoEnsureBlueprint(tx, config);

        // Determine next version number
        const latestPublishedVersion = await tx.examPublishedVersion.findFirst({
          where: { examConfigId: configId },
          orderBy: { versionNumber: "desc" },
        });

        finalVersionNumber = latestPublishedVersion
          ? latestPublishedVersion.versionNumber + 1
          : (config.currentVersionNumber ? config.currentVersionNumber + 1 : 1);
        finalVersionName = `${config.name} — V${finalVersionNumber}`;

        const configSnapshot = {
          id: config.id,
          name: config.name,
          code: config.code,
          role: config.role,
          description: config.description,
          durationMinutes: config.durationMinutes,
          totalQuestions: config.totalQuestions,
          sandboxUi: config.sandboxUi,
          difficultyDistribution: config.difficultyDistribution,
          hiringEvaluationConfig: config.hiringEvaluationConfig,
        };

        const scoringRulesSnapshot = {
          negativeMarkingEnabled: config.ruleFlags?.negativeMarkingEnabled ?? false,
          sectionalCutoffEnabled: config.ruleFlags?.sectionalCutoffEnabled ?? false,
          adaptiveDifficultyEnabled: config.ruleFlags?.adaptiveDifficultyEnabled ?? false,
          allowSectionNavigation: config.ruleFlags?.allowSectionNavigation ?? false,
          sectionTimingEnabled: config.ruleFlags?.sectionTimingEnabled ?? false,
          shuffleQuestionsEnabled: config.ruleFlags?.shuffleQuestionsEnabled ?? false,
          shuffleOptionsEnabled: config.ruleFlags?.shuffleOptionsEnabled ?? false,
          maxAttempts: config.ruleFlags?.maxAttempts ?? 3,
        };

        const versionDataToHash = {
          configSnapshot,
          scoringRulesSnapshot,
          sections: config.sections.map((s) => ({
            code: s.code,
            name: s.name,
            questionCount: s.questionCount,
            duration: s.sectionDurationMinutes,
            questions: s.questions.map((q) => q.id),
          })),
        };

        const versionHash = crypto
          .createHash("sha256")
          .update(JSON.stringify(versionDataToHash))
          .digest("hex");

        // Supersede previous active versions
        await tx.examPublishedVersion.updateMany({
          where: { examConfigId: configId, status: "ACTIVE" },
          data: { status: "SUPERSEDED" },
        });

        // Create new active immutable published version
        const newPublishedVersion = await tx.examPublishedVersion.create({
          data: {
            examConfigId: configId,
            versionNumber: finalVersionNumber,
            versionName: finalVersionName,
            status: "ACTIVE",
            versionHash,
            publishedBy: publishedBy ?? null,
            changelogSummary: `Published version ${finalVersionNumber}`,
            configSnapshot,
            scoringRulesSnapshot,
          },
        });

        createdPublishedVersionId = newPublishedVersion.id;

        // Create version sections
        const sectionsData = config.sections.map((section) => {
          const topicDistribution = section.sectionTopics.map((st) => ({
            topicId: st.topicId,
            topicName: st.topic.name,
            topicCode: st.topic.code,
            weightagePercentage: st.topicWeightage?.weightagePercentage ?? null,
          }));

          return {
            publishedVersionId: newPublishedVersion.id,
            sectionCode: section.code,
            sectionName: section.name,
            sectionOrder: section.sectionOrder,
            sectionDurationMinutes: section.sectionDurationMinutes,
            questionCount: section.questionCount,
            isRequired: section.isRequired,
            topicDistributionJson: topicDistribution as any,
          };
        });

        if (sectionsData.length > 0) {
          await tx.examVersionSection.createMany({
            data: sectionsData,
          });
        }

        // Create version questions
        const questionsData: any[] = [];
        for (const section of config.sections) {
          for (const question of section.questions) {
            const media =
              question.questionMedia?.map((m) => ({
                id: m.mediaAsset.id,
                storageKey: m.mediaAsset.storageKey,
                mimeType: m.mediaAsset.mimeType,
                altText: m.mediaAsset.altText,
                position: m.position,
              })) ?? [];

            let optionsJson: any = [];
            if (question.mcqData && typeof question.mcqData === "object") {
              const mcqObj = question.mcqData as any;
              optionsJson = Array.isArray(mcqObj)
                ? mcqObj
                : mcqObj.options || mcqObj.choices || [];
            }

            const correctAnswerJson = question.answer
              ? { correctOption: question.answer, answer: question.answer }
              : {};

            questionsData.push({
              publishedVersionId: newPublishedVersion.id,
              sectionCode: section.code,
              originalQuestionId: question.id,
              questionStem: question.questionText || question.questionStatement || "",
              questionType: question.questionType || "MCQ",
              difficulty: (question.difficulty as any) || "MEDIUM",
              optionsJson,
              correctAnswerJson,
              explanation: question.explanation,
              marks: 1.0,
              negativeMarks: config.ruleFlags?.negativeMarkingEnabled ? 0.25 : 0.0,
              mediaAttachmentsJson: media,
              codingDataJson: question.codingData as any,
              metadataJson: {
                conceptId: question.conceptId,
                topicId: question.topicId,
              },
            });
          }
        }

        if (questionsData.length > 0) {
          await tx.examVersionQuestion.createMany({
            data: questionsData,
          });
        }

        // Maintain backward compatibility with ExamConfigVersion
        await this.versionService.createVersion(config, tx);

        // Update ExamConfig status → PUBLISHED and pin active version
        await tx.examConfig.update({
          where: { id: configId },
          data: {
            status: "PUBLISHED",
            isActive: true,
            currentVersionNumber: finalVersionNumber,
            activeVersionId: newPublishedVersion.id,
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
            version: finalVersionName,
            publishedAt,
          },
        });
      },
      { timeout: 120000, maxWait: 60000 },
    );

    // ─── Step 6: Evict Caches (Candidate Dashboard + Catalog + Redis) ────────
    await this.cacheService.invalidateBlueprint?.(configId);
    await this.cacheService.delete?.("dashboard:examConfigs:available:v10");
    await this.cacheService.delete?.("dashboard:examConfigs:available:v2");
    CandidateDashboardRepository.invalidateGlobalExamConfigsCache();
    PublicTestsService.invalidateCache();

    // ─── Step 6: Dynamic Pre-Generated Pool Rebuild ──────────────────────────
    if (this.testPoolManager) {
      setImmediate(async () => {
        try {
          const ruleFlags = await (this.prisma as any)?.ruleFlags?.findUnique?.({
            where: { examConfigId: configId },
            select: { poolEnabled: true },
          });

          if (ruleFlags?.poolEnabled && this.testPoolManager) {
            this.logger.log(
              `[ConfigPublisher 🚀] Pool enabled for config ${configId}. Triggering background pool rebuild...`,
            );
            await this.testPoolManager.rebuildPool(configId);
          }
        } catch (poolErr: any) {
          this.logger.error(
            `[ConfigPublisher ⚠️] Post-publish background pool rebuild failed for config ${configId}: ${poolErr?.message || poolErr}`,
          );
        }
      });
    }

    return {
      configId,
      status: "PUBLISHED",
      version: finalVersionName,
      versionNumber: finalVersionNumber,
      publishedVersionId: createdPublishedVersionId,
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

    // If fully valid, mark status as VALIDATED (unless already PUBLISHED) and ensure blueprint exists
    if (validation.valid && dependencyCheck.valid) {
      if (config && config.status !== "PUBLISHED") {
        await this.prisma.examConfig.update({
          where: { id: configId },
          data: { status: "VALIDATED" },
        });
      }
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
