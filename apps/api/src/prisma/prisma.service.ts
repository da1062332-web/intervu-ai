import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Add automatic retry middleware for transient connection drops (e.g. Supabase socket resets)
    this.$use(async (params, next) => {
      let retries = 0;
      const maxRetries = 2;
      while (true) {
        try {
          return await next(params);
        } catch (err: any) {
          const msg = String(err?.message || "").toLowerCase();
          const isConnectionError =
            msg.includes("server has closed the connection") ||
            msg.includes("connection closed") ||
            msg.includes("can't reach database server") ||
            msg.includes("connection terminated") ||
            err?.code === "P1017" ||
            err?.code === "P1001" ||
            err?.code === "P1002";

          if (isConnectionError && retries < maxRetries) {
            retries++;
            this.logger.warn(
              `[PrismaService] Transient DB connection error on ${params.model}.${params.action} (${err?.message || err?.code}). Retrying attempt ${retries}/${maxRetries}...`,
            );
            await new Promise((res) => setTimeout(res, 250 * retries));
            continue;
          }
          throw err;
        }
      }
    });

    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
