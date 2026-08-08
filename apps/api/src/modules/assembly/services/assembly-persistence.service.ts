import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AssembledTestRepository } from "../repositories/assembled-test.repository";
import { AssemblyRepository } from "../repositories/assembly.repository";
import { AllocatedSectionDto } from "@intervu/shared";
import { AssemblyAuditService } from "./assembly-audit.service";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AssemblyPersistenceService {
  constructor(
    private readonly repository: AssembledTestRepository,
    private readonly testInstanceRepository: AssemblyRepository,
    private readonly auditService: AssemblyAuditService,
    private readonly prisma: PrismaService,
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

    // Create candidate test instance and nested sections & questions in testInstance table for execution controller session resolution
    try {
      const expiresAt = new Date(Date.now() + (totalDuration || 3600) * 1000);
      const queries: Prisma.PrismaPromise<unknown>[] = [];

      queries.push(
        this.prisma.testInstance.create({
          data: {
            id: assemblyId,
            userId,
            examConfigId: configId,
            status: "CREATED",
            expiresAt,
          },
        }),
      );

      for (const section of sections) {
        const sectionId = `sec_inst_${assemblyId}_${section.sectionKey}`;
        queries.push(
          this.prisma.testInstanceSection.create({
            data: {
              id: sectionId,
              testInstanceId: assemblyId,
              sectionKey: section.sectionKey,
              sectionName: (section as any).sectionName || section.displayName || "Section",
              durationSeconds: section.durationSeconds,
              questionCount: section.questionCount,
              orderIndex: section.orderIndex || 0,
            },
          }),
        );

        if (section.questions && section.questions.length > 0) {
          queries.push(
            this.prisma.testInstanceQuestion.createMany({
              data: section.questions.map((q, idx) => ({
                testInstanceId: assemblyId,
                sectionId,
                questionId: q.questionId,
                questionOrder: q.questionOrder ?? idx,
                questionSnapshot: (q.questionSnapshot as unknown as Prisma.InputJsonValue) || {},
              })),
            }),
          );
        }
      }

      await this.prisma.$transaction(queries);
    } catch (e: any) {
      console.error("AssemblyPersistenceService testInstance transaction error:", e?.message || e);
    }

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
