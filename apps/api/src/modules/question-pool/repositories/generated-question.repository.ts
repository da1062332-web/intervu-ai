import { Injectable, Optional } from "@nestjs/common";
import { GeneratedQuestion, Prisma, DifficultyLevel } from "@prisma/client";

import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class GeneratedQuestionRepository extends BaseRepository<
  GeneratedQuestion,
  Prisma.GeneratedQuestionCreateInput,
  Prisma.GeneratedQuestionUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "generatedQuestion", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new GeneratedQuestionRepository(this.prisma, tx) as this;
  }

  async findForConcept(
    conceptKey: string,
    difficultyLevel: DifficultyLevel,
    count: number,
  ): Promise<GeneratedQuestion[]> {
    return this.db.generatedQuestion.findMany({
      where: {
        conceptKey,
        difficultyLevel,
      },
      take: count,
    });
  }

  async findAvailableQuestions(
    difficulty: DifficultyLevel,
    excludeIds: string[],
    limit: number,
  ): Promise<GeneratedQuestion[]> {
    return this.db.generatedQuestion.findMany({
      where: {
        difficultyLevel: difficulty,
        id: { notIn: excludeIds },
      },
      take: limit,
      orderBy: { createdAt: "asc" },
    });
  }
}
