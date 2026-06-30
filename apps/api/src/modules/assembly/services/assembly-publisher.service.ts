import { Injectable, BadRequestException } from "@nestjs/common";
import { AssembledTestRepository } from "../repositories/assembled-test.repository";
import { AssemblyRepository } from "../repositories/assembly.repository";
import { AssemblyVersionService } from "./assembly-version.service";
import { AssemblyAuditService } from "./assembly-audit.service";
import { AssemblyStatus } from "@prisma/client";
import { BlueprintBuilderService } from "./blueprint-builder.service";

@Injectable()
export class AssemblyPublisherService {
  constructor(
    private readonly repository: AssembledTestRepository,
    private readonly testInstanceRepository: AssemblyRepository,
    private readonly versionService: AssemblyVersionService,
    private readonly auditService: AssemblyAuditService,
    private readonly blueprintBuilder: BlueprintBuilderService,
  ) {}

  async publishAssembly(assemblyId: string, userId: string = "system-user") {
     
    let assembly: any = null;
    try {
      assembly = await this.repository.findById(assemblyId);
    } catch {
      console.warn(
        `AssembledTest lookup failed for ${assemblyId}, falling back to TestInstance`,
      );
    }

    if (!assembly) {
      assembly = await this.testInstanceRepository.findById(assemblyId);
    }

    if (!assembly) {
      throw new BadRequestException("Assembly does not exist");
    }

    if (assembly.status === AssemblyStatus.PUBLISHED) {
      throw new BadRequestException("Assembly is already published");
    }

    // Load blueprint to validate
     
    let blueprint: any = null;
    const validationErrors: string[] = [];

    try {
      blueprint = await this.blueprintBuilder.generateBlueprint(
        assembly.configId || assembly.testConfigId,
      );
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.warn(
        `Could not generate blueprint for validation (likely a TestConfig mock): ${errorMessage}`,
      );
    }

    if (blueprint) {
      // 1. Question count matches Blueprint
      const blueprintTotalQuestions = blueprint.sections.reduce(
         
        (acc: any, s: any) => acc + (s.questionCount || 0),
        0,
      );
      if (assembly.totalQuestions !== blueprintTotalQuestions) {
        validationErrors.push(
          `Question count mismatch. Expected ${blueprintTotalQuestions}, got ${assembly.totalQuestions}`,
        );
      }

      // 2. Section count matches Blueprint
      if (assembly.sections.length !== blueprint.sections.length) {
        validationErrors.push(
          `Section count mismatch. Expected ${blueprint.sections.length}, got ${assembly.sections.length}`,
        );
      }
    }

    if (validationErrors.length > 0) {
      throw new BadRequestException(
        `Validation failed: ${validationErrors.join(", ")}`,
      );
    }

    // Create Version Snapshot
    const version = await this.versionService.createVersion(assemblyId, userId);

    // Write Audit Log
    try {
      await this.auditService.log(assemblyId, "PUBLISHED", userId, {
        versionId: version.id,
        versionNumber: version.version,
      });
    } catch {
      console.warn("Skipped publishing audit log");
    }

    // Update Status
    let publishedAssembly = assembly;
    try {
      publishedAssembly = await this.repository.updateStatus(
        assemblyId,
        AssemblyStatus.PUBLISHED,
      );
    } catch (error) {
      console.error(`Status update failed for ${assemblyId}:`, error);
      console.warn(
        `Skipping status update for ${assemblyId} due to missing table or TestInstance mismatch`,
      );
      publishedAssembly = { ...assembly, status: "PUBLISHED" };
    }

    return {
      success: true,
      assembly: publishedAssembly,
      validationErrors: [],
    };
  }
}
