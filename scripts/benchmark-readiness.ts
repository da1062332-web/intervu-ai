import { PrismaClient } from "@prisma/client";
import { ExamConfigReadinessService } from "../apps/api/src/modules/admin-config/services/exam-config-readiness.service";
import { ExamConfigUsageService } from "../apps/api/src/modules/question-bank/services/exam-config-usage.service";
import { TransactionalOutboxService } from "../apps/api/src/modules/question-bank/services/transactional-outbox.service";

const prisma = new PrismaClient();

async function benchmarkReadiness() {
  const outbox = new TransactionalOutboxService(prisma as any);
  const usage = new ExamConfigUsageService(prisma as any, outbox);
  const readiness = new ExamConfigReadinessService(prisma as any, usage);

  const configs = await prisma.examConfig.findMany({ take: 3 });
  console.log(`Testing readiness benchmark across ${configs.length} configs...`);

  for (const cfg of configs) {
    console.log(`\nTesting Config "${cfg.name}" (${cfg.id})...`);
    
    // Cold check
    const t0 = Date.now();
    const res = await readiness.checkReadiness(cfg.id);
    const elapsedCold = Date.now() - t0;
    console.log(`❄️ Cold Elapsed Time: ${elapsedCold}ms (${(elapsedCold / 1000).toFixed(2)}s) | Score: ${res.score}% | Status: ${res.status}`);

    // Warm check (cached)
    const t1 = Date.now();
    const resWarm = await readiness.checkReadiness(cfg.id);
    const elapsedWarm = Date.now() - t1;
    console.log(`🔥 Warm (Cached) Elapsed Time: ${elapsedWarm}ms | Score: ${resWarm.score}%`);
  }
}

benchmarkReadiness()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
