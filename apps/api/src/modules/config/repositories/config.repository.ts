import { Injectable, Optional } from "@nestjs/common";
import { SystemConfig, Prisma } from "@prisma/client";

import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class ConfigRepository extends BaseRepository<
  SystemConfig,
  Prisma.SystemConfigCreateInput,
  Prisma.SystemConfigUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "systemConfig", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new ConfigRepository(this.prisma, tx) as this;
  }

  async upsertConfig(
    id: string,
    value: Prisma.InputJsonValue,
  ): Promise<SystemConfig> {
    return this.db.systemConfig.upsert({
      where: { id },
      update: { value },
      create: { id, value },
    });
  }
}
