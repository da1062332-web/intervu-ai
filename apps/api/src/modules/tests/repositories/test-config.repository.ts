import { Injectable, Optional } from "@nestjs/common";
import { TestConfig, Prisma, TestSection } from "@prisma/client";

import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class TestConfigRepository extends BaseRepository<
  TestConfig,
  Prisma.TestConfigCreateInput,
  Prisma.TestConfigUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "testConfig", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new TestConfigRepository(this.prisma, tx) as this;
  }

  async findByIdWithSections(
    id: string,
  ): Promise<(TestConfig & { sections: TestSection[] }) | null> {
    return this.db.testConfig.findUnique({
      where: { id },
      include: { sections: true },
    });
  }
}
