import { Injectable } from "@nestjs/common";
import { AssemblyAuditRepository } from "../repositories/assembly-audit.repository";
import { Prisma } from "@prisma/client";

@Injectable()
export class AssemblyAuditService {
  constructor(private readonly repository: AssemblyAuditRepository) {}

  async log(
    assemblyId: string,
    action: string,
    userId: string = "system-user",
    metadata?: Record<string, unknown>,
  ) {
    return this.repository.createLog(
      assemblyId,
      action,
      userId,
      metadata as Prisma.InputJsonValue | undefined,
    );
  }

  async getLogsForAssembly(assemblyId: string) {
    return this.repository.findByAssemblyId(assemblyId);
  }
}
