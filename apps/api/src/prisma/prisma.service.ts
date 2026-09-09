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

    const dbUrl = process.env.DATABASE_URL || "";
    if (dbUrl.includes("supabase.co:5432")) {
      this.logger.warn(
        `[PrismaService] ⚠️ PERFORMANCE WARNING: DATABASE_URL is connecting directly to Supabase on port 5432. For optimal latency and throughput on Render, switch to the Supabase Transaction Pooler (port 6543 with ?pgbouncer=true).`
      );
    } else if (dbUrl.includes(":6543")) {
      this.logger.log(
        `[PrismaService] ⚡ Supabase Transaction Pooler (port 6543) active. High-concurrency connection pooling enabled.`
      );
    }

    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
