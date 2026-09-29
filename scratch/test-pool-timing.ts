import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

async function testClaim() {
  const configId = "cmsifafam000099s9csfe33pg";
  const userId = "test-timing-user";
  const t0 = Date.now();
  const claimedRows = await prisma.$queryRaw<any[]>(
    Prisma.sql`
      UPDATE "pregenerated_test_instances"
      SET "status" = 'CLAIMED',
          "claimed_by" = ${userId},
          "claimed_at" = NOW(),
          "updated_at" = NOW()
      WHERE "id" = (
        SELECT "id" FROM "pregenerated_test_instances"
        WHERE "config_id" = ${configId} AND "status" = 'READY'
        ORDER BY "created_at" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING "id", "config_id", "status", "sections_json";
    `,
  );
  console.log("Claim timing:", Date.now() - t0, "ms | Claimed:", claimedRows[0]?.id);
  if (claimedRows[0]) {
    // revert
    await prisma.pregeneratedTestInstance.update({
      where: { id: claimedRows[0].id },
      data: { status: "READY", claimedBy: null, claimedAt: null }
    });
  }
}

testClaim().finally(() => prisma.$disconnect());
