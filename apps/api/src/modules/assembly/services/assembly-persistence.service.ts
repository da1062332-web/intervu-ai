import { Injectable, NotFoundException, Logger, Inject } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import { AssembledTestRepository } from "../repositories/assembled-test.repository";
import { AssemblyRepository } from "../repositories/assembly.repository";
import { AllocatedSectionDto } from "@intervu/shared";
import { AssemblyAuditService } from "./assembly-audit.service";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AssemblyPersistenceService {
  private readonly logger = new Logger(AssemblyPersistenceService.name);

  constructor(
    @Inject(AssembledTestRepository)
    private readonly repository: AssembledTestRepository,
    @Inject(AssemblyRepository)
    private readonly testInstanceRepository: AssemblyRepository,
    @Inject(AssemblyAuditService)
    private readonly auditService: AssemblyAuditService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Instantly clones pre-attached sections & questions from a published AssembledTest
   * directly into a new candidate TestInstance in a single fast DB transaction (< 50ms).
   */
  async cloneReusableAssemblyForCandidate(
    reusableAssemblyId: string,
    configId: string,
    userId: string,
    durationSeconds: number = 3600,
  ): Promise<string> {
    const t0 = Date.now();
    this.logger.log(`    [CLONE-SERVICE ⏱️] Step 1/3: Fetching reusable assembly record ${reusableAssemblyId}...`);
    const reusable = await this.repository.findById(reusableAssemblyId);
    if (!reusable || !reusable.sections || reusable.sections.length === 0) {
      this.logger.error(`    [CLONE-SERVICE ❌] Reusable assembly ${reusableAssemblyId} not found or has no sections!`);
      throw new NotFoundException(
        `Reusable assembly ${reusableAssemblyId} not found or has no sections`,
      );
    }

    const testInstanceId = createId();
    const expiresAt = new Date(
      Date.now() + (durationSeconds || reusable.totalDurationSeconds || 3600) * 1000,
    );

    const queries: Prisma.PrismaPromise<unknown>[] = [];

    // 1. Create candidate TestInstance
    queries.push(
      this.prisma.testInstance.create({
        data: {
          id: testInstanceId,
          userId,
          examConfigId: configId,
          status: "CREATED",
          expiresAt,
        },
      }),
    );

    // 1b. Create AssembledTest reference for audit and snapshot compatibility
    queries.push(
      this.prisma.assembledTest.create({
        data: {
          id: testInstanceId,
          configId,
          status: "DRAFT",
          totalDurationSeconds: durationSeconds || reusable.totalDurationSeconds || 3600,
          totalQuestions: reusable.totalQuestions || 0,
        },
      }),
    );

    let totalClonedQuestions = 0;
    // 2. Clone sections & questions
    for (let i = 0; i < reusable.sections.length; i++) {
      const sec = reusable.sections[i];
      const instanceSectionId = `sec_inst_${testInstanceId}_${sec.sectionKey}`;

      queries.push(
        this.prisma.testInstanceSection.create({
          data: {
            id: instanceSectionId,
            testInstanceId,
            sectionKey: sec.sectionKey,
            sectionName: sec.sectionName || `Section ${i + 1}`,
            durationSeconds: sec.durationSeconds,
            questionCount: sec.questionCount || sec.questions?.length || 0,
            orderIndex: sec.orderIndex ?? i,
            status: i === 0 ? "ACTIVE" : "UPCOMING",
          },
        }),
      );

      if (sec.questions && sec.questions.length > 0) {
        totalClonedQuestions += sec.questions.length;
        queries.push(
          this.prisma.testInstanceQuestion.createMany({
            data: sec.questions.map((q: any, qIdx: number) => ({
              testInstanceId,
              sectionId: instanceSectionId,
              questionId: q.questionId,
              questionOrder: q.questionOrder ?? qIdx,
              questionSnapshot: (q.questionSnapshot as Prisma.InputJsonValue) || {},
            })),
          }),
        );
      }
    }

    // 3. Initialize ExecutionState for session
    const firstSection = reusable.sections[0];
    queries.push(
      this.prisma.executionState.create({
        data: {
          testInstanceId,
          currentQuestionIndex: 0,
          currentSectionIndex: 0,
          currentSectionKey: firstSection?.sectionKey || "default",
          remainingTimeSeconds: durationSeconds || reusable.totalDurationSeconds || 3600,
          lockedSectionKeys: [],
          markedQuestions: [],
          visitedQuestions: [],
        },
      }),
    );

    this.logger.log(`    [CLONE-SERVICE ⏱️] Step 2/3: Prepared ${queries.length} batch queries (${reusable.sections.length} sections, ${totalClonedQuestions} questions) in ${Date.now() - t0}ms`);

    const tTx = Date.now();
    this.logger.log(`    [CLONE-SERVICE ⏱️] Step 3/3: Executing Prisma $transaction with ${queries.length} queries...`);
    await this.prisma.$transaction(queries);
    this.logger.log(`    [CLONE-SERVICE ⚡] Step 3/3: Prisma transaction committed in ${Date.now() - tTx}ms!`);

    try {
      await this.auditService.log(testInstanceId, "CREATED", userId, {
        configId,
        reusableAssemblyId,
        cloned: true,
        totalQuestions: reusable.totalQuestions,
        totalDuration: durationSeconds || reusable.totalDurationSeconds,
      });
    } catch {
      // Audit logging is non-blocking
    }

    this.logger.log(`    [CLONE-SERVICE 🚀] Clone completed in ${Date.now() - t0}ms! Created candidate instance: ${testInstanceId}`);
    return testInstanceId;
  }

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

    const t0 = Date.now();
    const assemblyId = await this.repository.createAssemblyWithTransaction(
      configId,
      sections,
      totalDuration,
      totalQuestions,
    );
    this.logger.log(`    [SAVE-ASSEMBLY ⏱️] AssembledTest created in ${Date.now() - t0}ms (ID: ${assemblyId})`);

    await this.auditService.log(assemblyId, "CREATED", userId, {
      configId,
      totalQuestions,
      totalDuration,
    });

    // Create candidate test instance and nested sections & questions in testInstance table for execution controller session resolution
    try {
      const tTi = Date.now();
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
      this.logger.log(`    [SAVE-ASSEMBLY ⏱️] TestInstance snapshot committed to DB in ${Date.now() - tTi}ms!`);
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

    if (!assembly || !assembly.sections || assembly.sections.length === 0) {
      const fallback = await this.testInstanceRepository.findById(id);
      if (fallback && fallback.sections && fallback.sections.length > 0) {
        assembly = fallback;
      }
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
