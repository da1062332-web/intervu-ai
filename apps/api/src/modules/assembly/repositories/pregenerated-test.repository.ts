import { Injectable, Logger, Inject } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

export interface ClaimedPregeneratedInstance {
  id: string;
  configId: string;
  status: string;
  configVersionHash: string | null;
  sectionsJson: any;
  claimedBy: string | null;
  claimedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PregeneratedTestRepository {
  private readonly logger = new Logger(PregeneratedTestRepository.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Atomically claims one pre-generated test instance using PostgreSQL row-level locking
   * (SELECT ... FOR UPDATE SKIP LOCKED) in < 10ms.
   *
   * When `expectedVersionHash` is provided, only a instance generated from that exact
   * blueprint version is eligible — a pool instance baked before an admin edited the
   * exam's sections (question counts, topic weightage) no longer matches the live
   * config and must never be handed to a candidate. Passing `null`/`undefined` skips
   * the version check (used by tests and any caller that hasn't computed a hash).
   */
  async claimAtomicInstance(
    configId: string,
    userId: string,
    expectedVersionHash?: string | null,
  ): Promise<ClaimedPregeneratedInstance | null> {
    try {
      // 1. Primary path: Native PostgreSQL atomic claim
      const claimedRows = await this.prisma.$queryRaw<ClaimedPregeneratedInstance[]>(
        Prisma.sql`
          UPDATE "pregenerated_test_instances"
          SET "status" = 'CLAIMED',
              "claimed_by" = ${userId},
              "claimed_at" = NOW(),
              "updated_at" = NOW()
          WHERE "id" = (
            SELECT "id" FROM "pregenerated_test_instances"
            WHERE "config_id" = ${configId} AND "status" = 'READY'
              AND (
                ${expectedVersionHash ?? null}::text IS NULL
                OR "config_version_hash" = ${expectedVersionHash ?? null}
              )
            ORDER BY "created_at" ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
          )
          RETURNING
            "id",
            "config_id" AS "configId",
            "status",
            "config_version_hash" AS "configVersionHash",
            "sections_json" AS "sectionsJson",
            "claimed_by" AS "claimedBy",
            "claimed_at" AS "claimedAt",
            "created_at" AS "createdAt",
            "updated_at" AS "updatedAt";
        `,
      );

      if (claimedRows && claimedRows.length > 0) {
        this.logger.log(`  [POOL-CLAIM ⚡] Atomically claimed instance ${claimedRows[0].id} for candidate ${userId}`);
        return claimedRows[0];
      }

      return null;
    } catch (err: any) {
      // 2. Fallback path for unit testing / mock DB environments
      this.logger.warn(`  [POOL-CLAIM ⚠️] Raw SQL atomic claim failed (${err?.message || err}). Falling back to Prisma transaction...`);
      try {
        return await this.prisma.$transaction(async (tx) => {
          const candidate = await (tx as any).pregeneratedTestInstance.findFirst({
            where: {
              configId,
              status: "READY",
              ...(expectedVersionHash ? { configVersionHash: expectedVersionHash } : {}),
            },
            orderBy: { createdAt: "asc" },
          });

          if (!candidate) return null;

          const updated = await (tx as any).pregeneratedTestInstance.update({
            where: { id: candidate.id },
            data: {
              status: "CLAIMED",
              claimedBy: userId,
              claimedAt: new Date(),
            },
          });

          return updated as ClaimedPregeneratedInstance;
        });
      } catch (fallbackErr: any) {
        this.logger.error(`  [POOL-CLAIM ❌] Fallback pool claim failed: ${fallbackErr?.message || fallbackErr}`);
        return null;
      }
    }
  }

  /**
   * Marks READY instances whose content no longer matches the current blueprint
   * as EXPIRED, so they stop counting toward pool depth and are never claimed.
   * Returns the number of instances expired.
   */
  async expireStaleInstances(configId: string, currentVersionHash: string): Promise<number> {
    try {
      const result = await this.prisma.$executeRaw(
        Prisma.sql`
          UPDATE "pregenerated_test_instances"
          SET "status" = 'EXPIRED', "updated_at" = NOW()
          WHERE "config_id" = ${configId}
            AND "status" = 'READY'
            AND ("config_version_hash" IS NULL OR "config_version_hash" != ${currentVersionHash});
        `,
      );
      return Number(result) || 0;
    } catch (err: any) {
      this.logger.warn(`  [POOL-EXPIRE ⚠️] Failed to expire stale instances for ${configId}: ${err?.message || err}`);
      return 0;
    }
  }

  /**
   * Count available READY instances in the pool for a specific config
   */
  async countReadyInstances(configId: string): Promise<number> {
    try {
      return await (this.prisma as any).pregeneratedTestInstance.count({
        where: { configId, status: "READY" },
      });
    } catch {
      return 0;
    }
  }

  /**
   * Batch insert generated instances into the pool
   */
  async createInstancesBatch(
    configId: string,
    instances: Array<{ sectionsJson: any; configVersionHash?: string }>,
  ): Promise<number> {
    if (!instances || instances.length === 0) return 0;

    try {
      const result = await (this.prisma as any).pregeneratedTestInstance.createMany({
        data: instances.map((inst) => ({
          configId,
          status: "READY",
          configVersionHash: inst.configVersionHash || null,
          sectionsJson: inst.sectionsJson as Prisma.InputJsonValue,
        })),
      });

      return result.count;
    } catch (err: any) {
      this.logger.error(`Failed to batch insert pregenerated instances: ${err?.message || err}`);
      return 0;
    }
  }
}
