import "reflect-metadata";

// Set database URL to transaction pooler port 6543 before module loading
process.env.DATABASE_URL = "postgresql://postgres.ayklmzeqfezrlbkdusqc:MARVEL7ace%4077090@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres";
process.env.DIRECT_URL = "postgresql://postgres.ayklmzeqfezrlbkdusqc:MARVEL7ace%4077090@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres";

import { NestFactory } from "@nestjs/core";
import { AppModule } from "../apps/api/src/app.module";
import { ConfigPublisherService } from "../apps/api/src/modules/admin-config/publishing/config-publisher.service";
import { ExamConfigReadinessService } from "../apps/api/src/modules/admin-config/services/exam-config-readiness.service";
import { PrismaService } from "../apps/api/src/prisma/prisma.service";
import { BadRequestException } from "@nestjs/common";

async function testPublishReadinessGate() {
  console.log("=================================================");
  console.log("🧪 TESTING 100% READINESS GATE PUBLISHING ENFORCEMENT");
  console.log("=================================================\n");

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  
  try {
    const publisher = app.get(ConfigPublisherService);
    const readinessService = app.get(ExamConfigReadinessService);
    const prisma = app.get(PrismaService);

    // Find all active non-archived ExamConfigs
    const configs = await prisma.examConfig.findMany({
      where: { isArchived: false, status: { not: "ARCHIVED" } },
      include: { sections: true }
    });

    console.log(`📋 Found ${configs.length} active ExamConfigs in DB.`);

    // Find a config with readiness < 100%
    let targetConfig: any = null;
    let targetReadiness: any = null;

    for (const cfg of configs) {
      const rd = await readinessService.checkReadiness(cfg.id);
      if (rd.score < 100 || rd.status !== "READY") {
        targetConfig = cfg;
        targetReadiness = rd;
        break;
      }
    }

    if (!targetConfig) {
      console.log("⚠️ No ExamConfig with < 100% readiness found. Checking first available config...");
      if (configs.length > 0) {
        targetConfig = configs[0];
        targetReadiness = await readinessService.checkReadiness(targetConfig.id);
      }
    }

    if (!targetConfig) {
      console.log("❌ No ExamConfigs found in database.");
      await app.close();
      return;
    }

    console.log(`\n📌 Target ExamConfig: "${targetConfig.name}" (ID: ${targetConfig.id})`);
    console.log(`   Status: ${targetConfig.status}`);
    console.log(`   Readiness Score: ${targetReadiness.score}%`);
    console.log(`   Readiness Status: ${targetReadiness.status}`);
    console.log(`   Checks Breakdown:`);
    targetReadiness.checks.forEach((c: any) => {
      console.log(`   - [${c.status}] ${c.name}: ${c.message}`);
    });

    console.log("\n🚀 Executing publisher.publish() on target config...");

    if (targetReadiness.score < 100 || targetReadiness.status !== "READY") {
      try {
        await publisher.publish(targetConfig.id, "test-user");
        console.error("\n❌ FAILED SAFETY CHECK: Config was published despite readiness score being < 100%!");
      } catch (err: any) {
        if (err instanceof BadRequestException) {
          const res = err.getResponse() as any;
          if (res?.code === "READINESS_GATE_FAILED") {
            console.log("\n✅ VERIFIED & BLOCKED PROPERLY!");
            console.log(`   Exception Code: ${res.code}`);
            console.log(`   Exception Message: ${res.message}`);
            console.log(`   Failing Check Details:`);
            (res.errors || []).forEach((e: string) => console.log(`     * ${e}`));
          } else {
            console.log(`\n✅ VERIFIED & BLOCKED BY VALIDATION:`, res);
          }
        } else {
          console.error("\n⚠️ Unexpected error type thrown:", err);
        }
      }
    } else {
      console.log("\nTarget config is 100% READY. Attempting publish...");
      const result = await publisher.publish(targetConfig.id, "test-user");
      console.log("\n✅ SUCCESS: Published cleanly with 100% readiness!");
      console.log(`   Published Version: ${result.version}`);
    }

  } catch (error) {
    console.error("Test execution error:", error);
  } finally {
    await app.close();
    console.log("\n=================================================");
    console.log("🏁 TEST COMPLETE");
    console.log("=================================================");
  }
}

testPublishReadinessGate().catch(console.error);
