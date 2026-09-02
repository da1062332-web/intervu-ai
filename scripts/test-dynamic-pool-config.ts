import { PrismaClient } from "@prisma/client";
import { TestPoolManagerService } from "../apps/api/src/modules/assembly/services/test-pool-manager.service";
import { PregeneratedTestRepository } from "../apps/api/src/modules/assembly/repositories/pregenerated-test.repository";
import { AssembledTestRepository } from "../apps/api/src/modules/assembly/repositories/assembled-test.repository";
import { BlueprintBuilderService } from "../apps/api/src/modules/assembly/services/blueprint-builder.service";
import { QuestionAllocatorService } from "../apps/api/src/modules/assembly/services/question-allocator.service";
import { AssemblyValidatorService } from "../apps/api/src/modules/assembly/validators/assembly-validator.service";
import { BlueprintRepository } from "../apps/api/src/modules/assembly/repositories/blueprint.repository";

const prisma = new PrismaClient();

async function testDynamicPool() {
  console.log("================================================================================");
  console.log("🧪 TESTING DYNAMIC POOL CONFIGURATION & CAPACITY ADJUSTMENTS");
  console.log("================================================================================\n");

  const blueprintRepo = new BlueprintRepository(prisma as any);
  const blueprintBuilder = new BlueprintBuilderService(blueprintRepo, prisma as any);
  const pregeneratedRepo = new PregeneratedTestRepository(prisma as any);
  const assembledRepo = new AssembledTestRepository(prisma as any);
  const validator = new AssemblyValidatorService();
  const allocator = new QuestionAllocatorService({} as any, prisma as any);

  const poolManager = new TestPoolManagerService(
    prisma as any,
    blueprintBuilder,
    allocator,
    validator,
    pregeneratedRepo,
    assembledRepo,
  );

  const sampleConfig = await prisma.examConfig.findFirst({
    where: { isActive: true, status: "PUBLISHED" },
  });

  if (!sampleConfig) {
    console.warn("⚠️ No active published exam config found in DB.");
    return;
  }

  console.log(`📌 Using Exam Config: "${sampleConfig.name}" (ID: ${sampleConfig.id})`);

  // 1. Initial Pool Status
  console.log("\n1️⃣ Getting initial pool status...");
  const initialStatus = await poolManager.getPoolStatus(sampleConfig.id);
  console.log("Initial Status:", initialStatus);

  // 2. Dynamically Increase Pool Target Capacity to 25
  console.log("\n2️⃣ Dynamically increasing poolTargetSize to 25 and poolMinThreshold to 5...");
  const updatedStatus = await poolManager.updatePoolConfig(sampleConfig.id, {
    poolEnabled: true,
    poolTargetSize: 25,
    poolMinThreshold: 5,
    poolRefillBatchSize: 10,
  });
  console.log("Updated Status:", updatedStatus);

  if (
    updatedStatus.poolTargetSize !== 25 ||
    updatedStatus.poolMinThreshold !== 5 ||
    updatedStatus.poolEnabled !== true
  ) {
    throw new Error("❌ Failed to update dynamic pool configuration!");
  }
  console.log("✅ PASS: Successfully updated dynamic pool capacity to 25.");

  // 3. Dynamically Decrease Pool Target Capacity back to 10
  console.log("\n3️⃣ Dynamically decreasing poolTargetSize to 10...");
  const finalStatus = await poolManager.updatePoolConfig(sampleConfig.id, {
    poolTargetSize: 10,
    poolMinThreshold: 3,
  });
  console.log("Final Status:", finalStatus);

  if (finalStatus.poolTargetSize !== 10 || finalStatus.poolMinThreshold !== 3) {
    throw new Error("❌ Failed to decrease dynamic pool capacity!");
  }
  console.log("✅ PASS: Successfully decreased dynamic pool capacity to 10.");

  console.log("\n================================================================================");
  console.log("🎉 ALL DYNAMIC POOL CONFIGURATION TESTS PASSED!");
  console.log("================================================================================\n");
}

testDynamicPool()
  .catch((err) => {
    console.error("❌ Dynamic pool test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
