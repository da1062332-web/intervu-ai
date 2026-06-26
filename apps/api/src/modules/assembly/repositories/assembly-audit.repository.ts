import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class AssemblyAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(
    assemblyId: string,
    action: string,
    userId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.prisma.assemblyAuditLog.create({
      data: {
        assemblyId,
        action,
        userId,
        metadata,
      },
    });
  }

  async findByAssemblyId(assemblyId: string) {
    return this.prisma.assemblyAuditLog.findMany({
      where: { assemblyId },
      orderBy: { createdAt: "desc" },
    });
  }
}
