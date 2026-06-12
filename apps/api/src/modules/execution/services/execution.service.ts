import { Injectable, NotFoundException } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { TestInstanceRepository } from "../repositories";
import { ExecutionValidatorService } from "./execution-validator.service";

@Injectable()
export class ExecutionService {
  private readonly logger = new AppLogger({ name: "ExecutionService" });

  constructor(
    private readonly prisma: PrismaService,
    private readonly testInstanceRepo: TestInstanceRepository,
    private readonly validator: ExecutionValidatorService,
  ) {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  async loadAssessment(testInstanceId: string, userId: string): Promise<any> {
    this.logger.debug("Loading assessment snapshot", { testInstanceId, userId });
    // 1. Validate assessment exists
    const testInstance = await this.validator.validateAssessment(testInstanceId);

    // 2. Validate ownership
    this.validator.validateOwnership(testInstance, userId);

    // 3. Load full snapshot (sections, questions)
    // We use the repository method for deep relational loading to avoid bypassing the abstraction layer
    const snapshot = await this.testInstanceRepo.loadDeepSnapshot(testInstanceId);

    if (!snapshot) {
      throw new NotFoundException("Assessment snapshot could not be loaded");
    }

    return {
      testInstanceId: snapshot.id,
      testConfigId: snapshot.testConfigId,
      status: snapshot.status,
      expiresAt: snapshot.expiresAt,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      sections: snapshot.sections.map((section: { id: any; sectionKey: any; sectionName: any; durationSeconds: any; questions: any[]; }) => ({
        sectionId: section.id,
        sectionKey: section.sectionKey,
        sectionName: section.sectionName,
        durationSeconds: section.durationSeconds,
        questions: section.questions.map(q => ({
          questionId: q.questionId,
          questionOrder: q.questionOrder,
          snapshot: q.questionSnapshot,
        }))
      }))
    };
  }
}
