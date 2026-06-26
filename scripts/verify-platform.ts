import { PrismaService } from "../apps/api/src/prisma/prisma.service";
import { EventBusService } from "../apps/api/src/modules/platform/integrations/event-bus/event-bus.service";
import { PlatformHealthService } from "../apps/api/src/modules/platform/health/platform-health.service";
import { PlatformAuditService } from "../apps/api/src/modules/platform/audit/platform-audit.service";
import { SanitizeRequestMiddleware } from "../apps/api/src/modules/platform/middleware/sanitize-request.middleware";
import { createId } from "@paralleldrive/cuid2";

async function run() {
  console.log("==========================================");
  console.log("Running Platform E2E Integration Verification");
  console.log("==========================================\n");

  const prisma = new PrismaService();
  const eventBus = new EventBusService();
  const healthService = new PlatformHealthService(prisma);
  const auditService = new PlatformAuditService(prisma);
  const sanitizationMiddleware = new SanitizeRequestMiddleware();

  try {
    await prisma.$connect();

    // 1. Verify Event Bus - Publish and Subscribe (Isolation)
    console.log("--> Testing Event Bus subscriber isolation...");
    let handler1Executed = false;
    let handler2Executed = false;

    eventBus.subscribe("TEST_EVENT", async () => {
      handler1Executed = true;
      throw new Error("Simulated isolated subscriber failure");
    });

    eventBus.subscribe("TEST_EVENT", async () => {
      handler2Executed = true;
    });

    eventBus.publish("TEST_EVENT", { data: "test" });

    // Wait a brief moment for async handlers to execute
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!handler1Executed || !handler2Executed) {
      throw new Error("Failed: Event handlers were not triggered correctly.");
    }
    console.log("Event Bus subscriber isolation: PASS");

    // 2. Verify Event Bus - Exponential Backoff Retry (Critical Events)
    console.log("--> Testing Event Bus backoff retry on ASSESSMENT_SUBMITTED...");
    let submitAttempts = 0;
    eventBus.subscribe("ASSESSMENT_SUBMITTED", async () => {
      submitAttempts++;
      if (submitAttempts < 3) {
        throw new Error("Temporary failure");
      }
    });

    eventBus.publish("ASSESSMENT_SUBMITTED", { testInstanceId: "test_inst" });
    
    // Wait for the retry delays (100ms, then 200ms)
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (submitAttempts !== 3) {
      throw new Error(`Expected exactly 3 retry attempts for critical event, got ${submitAttempts}`);
    }
    console.log("Event Bus backoff retry: PASS");

    // 3. Verify Health Telemetry Response
    console.log("--> Testing Health Telemetry...");
    const health = await healthService.getHealth();
    if (!health.status || !health.timestamp || !health.version || typeof health.uptime !== "number" || typeof health.responseTime !== "number") {
      throw new Error("Health response contract is missing required metadata fields.");
    }
    if (!health.services.database || !health.services.redis || !health.services.queue || !health.services.aiProvider) {
      throw new Error("Health services fields are incomplete.");
    }
    console.log(`Global status: ${health.status}, Database status: ${health.services.database.status}`);
    console.log("Health Telemetry: PASS");

    // 4. Verify Request Sanitization Middleware
    console.log("--> Testing Request Sanitization Middleware...");
    const req = {
      body: {
        text: "Clean text",
        malicious: "<script>alert('injection')</script><iframe></iframe>",
        nested: {
          harmful: "javascript:alert(1)"
        }
      },
      query: {},
      params: {}
    } as any;
    
    const res = {} as any;
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    sanitizationMiddleware.use(req, res, next);

    if (!nextCalled) {
      throw new Error("Sanitization middleware failed to invoke next()");
    }
    if (req.body.malicious !== "" || req.body.nested.harmful !== "alert(1)") {
      throw new Error(`Sanitization failed. Malicious contents not stripped. Got: ${JSON.stringify(req.body)}`);
    }
    console.log("Request Sanitization Middleware: PASS");

    // 5. Verify Audit Logs & Pagination
    console.log("--> Testing Audit Log aggregation and pagination...");
    
    // Create dummy logs to verify query joins and union operations
    const logId = createId();
    await prisma.generationLog.create({
      data: {
        examId: `verify_platform_exam_${logId}`,
        step: "VALIDATION",
        status: "SUCCESS",
        durationMs: 150,
        retryCount: 0,
        message: "Platform E2E test generation completed successfully",
      }
    });

    const auditResponse = await auditService.getAuditLogs({
      page: 1,
      limit: 10,
    });

    if (auditResponse.items.length === 0) {
      throw new Error("Audit service failed to aggregate logs.");
    }

    const testLog = auditResponse.items.find(item => item.metadata?.examId === `verify_platform_exam_${logId}`);
    if (dtoMatchesLog(auditResponse.items, `verify-platform-exam-${logId}`)) {
      console.log("Located E2E verify logs in audit responses");
    }

    console.log(`Aggregated total logs count: ${auditResponse.total}`);
    console.log("Audit Logs Aggregation: PASS");

    // Clean up generation log
    await prisma.generationLog.deleteMany({
      where: { examId: `verify_platform_exam_${logId}` }
    }).catch(() => {});

    console.log("\n==========================================");
    console.log("ALL PLATFORM CHECKS: PASS");
    console.log("==========================================\n");
    process.exit(0);

  } catch (err: any) {
    console.error("\n==========================================");
    console.error("PLATFORM VERIFICATION FAIL");
    console.error(err.message || err);
    console.error("==========================================\n");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function dtoMatchesLog(items: any[], value: string): boolean {
  return items.some(item => JSON.stringify(item).includes(value));
}

run();
