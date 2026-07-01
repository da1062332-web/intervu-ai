import { Injectable, NotFoundException } from "@nestjs/common";
import { AssembledTestRepository } from "../repositories/assembled-test.repository";
import { AssemblyRepository } from "../repositories/assembly.repository";
import { AllocatedSectionDto } from "@intervu/shared";
import { AssemblyAuditService } from "./assembly-audit.service";

@Injectable()
export class AssemblyPersistenceService {
  constructor(
    private readonly repository: AssembledTestRepository,
    private readonly testInstanceRepository: AssemblyRepository,
    private readonly auditService: AssemblyAuditService,
  ) {}

  async saveAssembly(
    configId: string,
    sections: AllocatedSectionDto[],
    userId: string = "system-user",
  ): Promise<string> {
    const totalQuestions = sections.reduce(
      (acc, s) => acc + s.questionCount,
      0,
    );
    const totalDuration = sections.reduce(
      (acc, s) => acc + s.durationSeconds,
      0,
    );

    const assemblyId = await this.repository.createAssemblyWithTransaction(
      configId,
      sections,
      totalDuration,
      totalQuestions,
    );

    await this.auditService.log(assemblyId, "CREATED", userId, {
      configId,
      totalQuestions,
      totalDuration,
    });

    return assemblyId;
  }

  async getAssembly(id: string) {
    let assembly: any = null;
    try {
      assembly = await this.repository.findById(id);
    } catch {
      console.warn(`Fallback to testInstance in persistence for ${id}`);
    }

    if (!assembly) {
      assembly = await this.testInstanceRepository.findById(id);
    }

    if (!assembly) {
      throw new NotFoundException(`Assembly with ID ${id} not found`);
    }
    return assembly;
  }

  async updateAssembly(
    id: string,
    sections: AllocatedSectionDto[],
    userId: string = "system-user",
  ): Promise<void> {
    const assembly = await this.getAssembly(id);

    const totalQuestions = sections.reduce(
      (acc, s) => acc + s.questionCount,
      0,
    );
    const totalDuration = sections.reduce(
      (acc, s) => acc + s.durationSeconds,
      0,
    );

    await this.repository.replaceAssemblyWithTransaction(
      id,
      sections,
      totalDuration,
      totalQuestions,
    );

    await this.auditService.log(id, "UPDATED", userId, {
      previousTotalQuestions: assembly.totalQuestions,
      newTotalQuestions: totalQuestions,
      previousTotalDuration: assembly.totalDurationSeconds,
      newTotalDuration: totalDuration,
    });
  }

  async deleteAssembly(id: string, userId: string = "system-user") {
    const assembly = await this.getAssembly(id);

    await this.repository.delete(id);

    // Note: audit logs might be cascadingly deleted if setup that way in Prisma.
    // If we want the audit trail to survive, we'd need soft deletes.
    // Assuming cascading delete for now, but we can log before deletion just in case.
    await this.auditService.log(id, "DELETED", userId, {
      statusBeforeDelete: assembly.status,
    });

    return { success: true };
  }
}
