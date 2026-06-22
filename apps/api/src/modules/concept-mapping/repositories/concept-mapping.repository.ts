import { Injectable, Optional } from "@nestjs/common";
import { Concept, Prisma, ConceptStatus } from "@prisma/client";
import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class ConceptMappingRepository extends BaseRepository<
  Concept & { deletedAt?: Date | null },
  Prisma.ConceptUncheckedCreateInput,
  Prisma.ConceptUncheckedUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "concept", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new ConceptMappingRepository(this.prisma, tx) as this;
  }

  async findByTopicAndCode(topicId: string, code: string) {
    return this.prisma.concept.findFirst({
      where: {
        topicId,
        code,
      },
    });
  }

  async findManyByTopicId(topicId: string, activeOnly = true) {
    return this.prisma.concept.findMany({
      where: {
        topicId,
        ...(activeOnly ? { status: ConceptStatus.ACTIVE } : {}),
      },
      orderBy: { code: "asc" },
    });
  }

  // Override delete to set status: INACTIVE
  override async delete(id: string): Promise<Concept> {
    return this.prisma.concept.update({
      where: { id },
      data: { status: ConceptStatus.INACTIVE },
    });
  }
}
