import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function applyPoolDdl() {
  console.log("Applying dynamic pool DDL to PostgreSQL...");

  // 1. Add pool columns to rule_flags if they do not exist
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "RuleFlags" 
    ADD COLUMN IF NOT EXISTS "pool_enabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "pool_target_size" INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN IF NOT EXISTS "pool_min_threshold" INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN IF NOT EXISTS "pool_refill_batch_size" INTEGER NOT NULL DEFAULT 5;
  `);
  console.log("✅ RuleFlags pool columns verified/added.");

  // 2. Create pregenerated_test_instances table if it does not exist
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "pregenerated_test_instances" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "config_id" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'READY',
      "config_version_hash" TEXT,
      "sections_json" JSONB NOT NULL,
      "claimed_by" TEXT,
      "claimed_at" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "pregenerated_test_instances_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "ExamConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  console.log("✅ pregenerated_test_instances table verified/created.");

  // 3. Create index on (config_id, status)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "pregenerated_test_instances_config_id_status_idx" 
    ON "pregenerated_test_instances"("config_id", "status");
  `);
  console.log("✅ Indexes created successfully.");

  console.log("\n🎉 Database DDL update complete!");
}

applyPoolDdl()
  .catch((err) => {
    console.error("❌ Failed applying DDL:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
