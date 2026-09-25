import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private keepAliveInterval: NodeJS.Timeout | null = null;

  constructor() {
    super({
      transactionOptions: {
        maxWait: 60000, // Wait up to 60s to acquire transaction from database pool
        timeout: 180000, // Allow up to 3 mins for transaction execution
      },
      log:
        process.env.NODE_ENV === "development"
          ? ["warn", "error"]
          : ["error"],
    });
  }

  async onModuleInit() {
    // Add automatic retry middleware for transient connection drops (e.g. Supabase socket resets)
    this.$use(async (params, next) => {
      let retries = 0;
      const maxRetries = 3;
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
            msg.includes("timed out fetching a new connection") ||
            err?.code === "P1017" ||
            err?.code === "P1001" ||
            err?.code === "P1002" ||
            err?.code === "P2024";

          if (isConnectionError && retries < maxRetries) {
            retries++;
            this.logger.warn(
              `[PrismaService] Transient DB connection error on ${params.model}.${params.action} (${err?.message || err?.code}). Retrying attempt ${retries}/${maxRetries}...`,
            );
            await new Promise((res) => setTimeout(res, 300 * retries));
            continue;
          }
          throw err;
        }
      }
    });

    const dbUrl = process.env.DATABASE_URL || "";
    if (dbUrl.includes("supabase.co:5432")) {
      this.logger.warn(
        `[PrismaService] ⚠️  PERFORMANCE WARNING: DATABASE_URL is connecting directly to Supabase on port 5432 (direct connection). ` +
        `For 500+ concurrent candidates, switch to the Supabase Transaction Pooler (port 6543, ?pgbouncer=true) ` +
        `and add ?connection_limit=25 to the URL.`
      );
    } else if (dbUrl.includes(":6543")) {
      const poolParam = dbUrl.match(/connection_limit=(\d+)/)?.[1];
      this.logger.log(
        `[PrismaService] ⚡ Supabase Transaction Pooler (port 6543) active. ` +
        `connection_limit=${poolParam ?? "not set — recommend ?connection_limit=25 for 500-candidate load"}`
      );
    }

    // Log libuv threadpool size — critical for argon2 throughput under concurrent signup load
    const uvThreadpool = process.env.UV_THREADPOOL_SIZE ?? "4 (default — set UV_THREADPOOL_SIZE=16 for concurrent signup load)";
    this.logger.log(`[PrismaService] UV_THREADPOOL_SIZE=${uvThreadpool}`);

    await this.$connect();

    // Periodic heartbeat every 45 seconds to keep Supabase pooler connections warm and avoid idle socket resets
    this.keepAliveInterval = setInterval(async () => {
      try {
        await this.$queryRaw`SELECT 1`;
      } catch (_) {
        // Ignored; if a socket dropped, next query/retry will reconnect cleanly
      }
    }, 45000);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    await this.$disconnect();
  }
}
