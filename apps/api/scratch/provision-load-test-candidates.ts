/**
 * One-time provisioning for the k6 1000-candidate load test.
 *
 * The real /auth/signup flow works fine under k6, but freshly-signed-up
 * accounts have no billing plan, so EligibilityService rejects /tests/start
 * with QUOTA_EXHAUSTED. Real candidates get access via an admin-granted
 * allowed_assessments override (the same mechanism used for referral
 * rewards) — this script grants that to a batch of deterministic
 * loadtest-*@skillitrix-loadtest.invalid accounts so the load test measures
 * real assessment-taking capacity, not the billing gate.
 */
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

const COUNT = Number(process.env.COUNT || 1000);
const EXAM_CONFIG_ID = process.env.EXAM_CONFIG_ID || "cmsifafam000099s9csfe33pg"; // Qloax Assessment
const PASSWORD = process.env.LOADTEST_PASSWORD || "LoadTest#1000!";
const CONCURRENCY = 10; // stay well under the 15-connection pool

async function inBatches<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

async function main() {
  const exam = await prisma.examConfig.findUnique({
    where: { id: EXAM_CONFIG_ID },
    select: { id: true, code: true, name: true, status: true, isActive: true },
  });
  if (!exam) throw new Error(`ExamConfig ${EXAM_CONFIG_ID} not found`);
  console.log(`Provisioning ${COUNT} candidates for "${exam.name}" (${exam.code})`);

  const passwordHash = await argon2.hash(PASSWORD);
  const emails = Array.from({ length: COUNT }, (_, i) => `loadtest-${i + 1}@skillitrix-loadtest.invalid`);

  let created = 0;
  let existing = 0;
  const userIds: string[] = [];

  await inBatches(emails, CONCURRENCY, async (email) => {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        fullName: `Load Test Candidate ${email.split("-")[1].split("@")[0]}`,
      },
      select: { id: true, createdAt: true },
    });
    userIds.push(user.id);
    if (Date.now() - user.createdAt.getTime() < 5000) created++;
    else existing++;
  });

  console.log(`Users ready: ${created} created, ${existing} already existed (total ${userIds.length})`);

  // Skip users that already have an active allowed_assessments override for this exam
  const alreadyGranted = await prisma.userQuotaOverride.findMany({
    where: {
      userId: { in: userIds },
      featureKey: { in: ["allowed_assessments", "allowedAssessments"] },
    },
    select: { userId: true },
  });
  const grantedSet = new Set(alreadyGranted.map((o) => o.userId));
  const toGrant = userIds.filter((id) => !grantedSet.has(id));

  if (toGrant.length > 0) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h — self-cleans up
    await prisma.userQuotaOverride.createMany({
      data: toGrant.map((userId) => ({
        userId,
        featureKey: "allowed_assessments",
        overrideValue: {
          assessments: [exam.id, exam.code],
          attemptsPerExam: 3,
        },
        reason: "Load test access grant (k6, self-expiring in 24h)",
        expiresAt,
      })),
    });
  }

  console.log(`Quota grants: ${toGrant.length} new, ${grantedSet.size} already had access`);
  console.log("Done. Accounts: loadtest-1@skillitrix-loadtest.invalid .. loadtest-" + COUNT + "@skillitrix-loadtest.invalid");
  console.log(`Password: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
