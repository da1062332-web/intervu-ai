import { Injectable, Logger } from "@nestjs/common";
import { AssembledTestRepository } from "../repositories/assembled-test.repository";
import { AssemblyVersionRepository } from "../repositories/assembly-version.repository";
import { TestPackageService } from "./test-package.service";
import { AssemblyValidationV2Service } from "./assembly-validation-v2.service";
import { BlueprintBuilderService } from "./blueprint-builder.service";
import { AssemblyStatus } from "@prisma/client";
import { AssemblyValidationReportDto } from "@intervu/shared";

/** A single named readiness check and its result */
export interface ReadinessCheck {
  name: string;
  passed: boolean;
  message: string;
}

/** Full publish readiness report from PublishReadinessService */
export interface PublishReadinessReport {
  /** True only when ALL checks pass */
  ready: boolean;
  checks: ReadinessCheck[];
  /** Human-readable summary */
  summary: string;
}

/**
 * PublishReadinessService — 6-check pre-publish gate.
 *
 * Runs BEFORE AssemblyPublisherService.publishAssembly() is called.
 * This service does NOT replace the publisher — it gates it.
 *
 * If any check fails, the publish flow is blocked (throws 400).
 * The readiness report is also available via POST /assembly/:id/readiness
 * so admins can diagnose issues before attempting to publish.
 *
 * Checks (in order):
 * 1. Assembly exists in database
 * 2. Assembly is not already PUBLISHED or ARCHIVED
 * 3. Blueprint is loadable (ExamConfig exists and is parseable)
 * 4. Assembly passes V2 validation (no errors)
 * 5. At least one version snapshot exists
 * 6. Test package can be generated (dry-run, no persist)
 */
@Injectable()
export class PublishReadinessService {
  private readonly logger = new Logger(PublishReadinessService.name);

  constructor(
    private readonly assembledTestRepository: AssembledTestRepository,
    private readonly versionRepository: AssemblyVersionRepository,
    private readonly packageService: TestPackageService,
    private readonly validationV2: AssemblyValidationV2Service,
    private readonly blueprintBuilder: BlueprintBuilderService,
  ) {}

  /**
   * Run all 6 readiness checks for a given assembly.
   *
   * @param assemblyId - The assembly to check
   * @returns PublishReadinessReport with check details
   */
  async check(assemblyId: string): Promise<PublishReadinessReport> {
    const checks: ReadinessCheck[] = [];

    // --- Check 1: Assembly exists ---
    let assembly: Awaited<
      ReturnType<typeof this.assembledTestRepository.findById>
    > = null;
    try {
      assembly = await this.assembledTestRepository.findById(assemblyId);
      checks.push({
        name: "Assembly Exists",
        passed: !!assembly,
        message: assembly
          ? `Assembly ${assemblyId} found with ${assembly.totalQuestions} questions`
          : `Assembly ${assemblyId} not found`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      checks.push({
        name: "Assembly Exists",
        passed: false,
        message: `DB error: ${msg}`,
      });
    }

    if (!assembly) {
      return this.buildReport(
        checks,
        "Assembly not found. Cannot run further checks.",
      );
    }

    // --- Check 2: Assembly status is valid for publishing ---
    const badStatuses: string[] = [
      AssemblyStatus.PUBLISHED,
      AssemblyStatus.ARCHIVED,
    ];
    const statusOk = !badStatuses.includes(assembly.status as AssemblyStatus);
    checks.push({
      name: "Assembly Status",
      passed: statusOk,
      message: statusOk
        ? `Assembly status is ${assembly.status} (publishable)`
        : `Assembly is already ${assembly.status} and cannot be published again`,
    });

    // --- Check 3: Blueprint is loadable ---

    let blueprint: Awaited<
      ReturnType<typeof this.blueprintBuilder.generateBlueprint>
    > | null = null;
    try {
      blueprint = await this.blueprintBuilder.generateBlueprint(
        assembly.configId,
      );
      checks.push({
        name: "Blueprint Loadable",
        passed: true,
        message: `Blueprint loaded: ${blueprint.sections.length} sections, ${blueprint.totalQuestions} questions`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      checks.push({
        name: "Blueprint Loadable",
        passed: false,
        message: `Blueprint error: ${msg}`,
      });
    }

    // --- Check 4: V2 Validation passes ---
    if (blueprint) {
      try {
        // Map assembled sections for validation
        const sections = (assembly.sections ?? []).map(
          (s: {
            sectionKey: string;
            sectionName: string;
            durationSeconds: number;
            questionCount: number;
            orderIndex: number;
            questions: Array<{
              questionId: string;
              questionOrder: number;
              questionSnapshot: unknown;
            }>;
          }) => ({
            sectionKey: s.sectionKey,
            displayName: s.sectionName,
            durationSeconds: s.durationSeconds,
            questionCount: s.questionCount,
            orderIndex: s.orderIndex,
            questions: (s.questions ?? []).map((q) => {
              const snap =
                (q.questionSnapshot as Record<string, unknown>) ?? {};
              return {
                questionId: q.questionId,
                questionHash: (snap["questionHash"] as string) ?? q.questionId,
                conceptKey: (snap["conceptKey"] as string) ?? "",
                difficultyLevel:
                  (snap["difficultyLevel"] as string) ?? "MEDIUM",
                questionType:
                  (snap["questionType"] as string) ?? "MULTIPLE_CHOICE",
                questionOrder: q.questionOrder,
                questionSnapshot: q.questionSnapshot,
              };
            }),
          }),
        );

        const validationReport: AssemblyValidationReportDto =
          this.validationV2.validate(blueprint, sections);
        checks.push({
          name: "V2 Validation",
          passed: validationReport.valid,
          message: validationReport.valid
            ? `Validation passed: coverage=${validationReport.coverage}%, accuracy=${validationReport.difficultyAccuracy}%`
            : `Validation failed: ${validationReport.errors.slice(0, 3).join("; ")}`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        checks.push({
          name: "V2 Validation",
          passed: false,
          message: `Validation error: ${msg}`,
        });
      }
    } else {
      checks.push({
        name: "V2 Validation",
        passed: false,
        message: "Skipped — blueprint not loadable",
      });
    }

    // --- Check 5: Version snapshot exists ---
    try {
      const latestVersion =
        await this.versionRepository.getLatestVersionNumber(assemblyId);
      const hasVersion = latestVersion > 0;
      checks.push({
        name: "Version Snapshot Exists",
        passed: hasVersion,
        message: hasVersion
          ? `Latest version: v${latestVersion}`
          : "No version snapshots found. Create a version before publishing.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      checks.push({
        name: "Version Snapshot Exists",
        passed: false,
        message: `Version check error: ${msg}`,
      });
    }

    // --- Check 6: Package generation dry-run ---
    try {
      const pkg = await this.packageService.generatePackage(assemblyId);
      const packageOk = pkg.sections.length > 0 && pkg.totalQuestions > 0;
      checks.push({
        name: "Package Generation",
        passed: packageOk,
        message: packageOk
          ? `Package ready: ${pkg.sections.length} sections, ${pkg.totalQuestions} questions`
          : "Package generated but empty — no sections or questions",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      checks.push({
        name: "Package Generation",
        passed: false,
        message: `Package error: ${msg}`,
      });
    }

    const allPassed = checks.every((c) => c.passed);
    const failedChecks = checks.filter((c) => !c.passed);

    const summary = allPassed
      ? `Assembly ${assemblyId} is READY to publish. All ${checks.length} checks passed.`
      : `Assembly ${assemblyId} is NOT READY. ${failedChecks.length} check(s) failed: ` +
        failedChecks.map((c) => c.name).join(", ");

    this.logger.log(summary);

    return { ready: allPassed, checks, summary };
  }

  private buildReport(
    checks: ReadinessCheck[],
    summary: string,
  ): PublishReadinessReport {
    return {
      ready: checks.every((c) => c.passed),
      checks,
      summary,
    };
  }
}
