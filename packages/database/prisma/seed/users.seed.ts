import { PrismaClient, UserRole } from "@prisma/client";
import * as argon2 from "argon2";

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  console.log("Seeding users...");
  const passwordHash = await argon2.hash("Intervu123!");

  // Seed Admin
  await prisma.user.upsert({
    where: { email: "admin@intervu.ai" },
    update: {},
    create: {
      email: "admin@intervu.ai",
      passwordHash,
      fullName: "System Administrator",
      role: UserRole.ADMIN,
    },
  });

  // Seed Candidate
  const candidateUser = await prisma.user.upsert({
    where: { email: "candidate@intervu.ai" },
    update: {},
    create: {
      email: "candidate@intervu.ai",
      passwordHash,
      fullName: "John Doe (VIP Tester)",
      role: UserRole.CANDIDATE,
    },
  });

  // Ensure Candidate has active VIP Subscription and Unlimited Quota
  await prisma.subscription.upsert({
    where: { userId: candidateUser.id },
    update: {
      status: "ACTIVE",
      plan: "TEAMS",
      currentPeriodEnd: new Date("2099-12-31T23:59:59.999Z"),
      cancelAtPeriodEnd: false,
    },
    create: {
      userId: candidateUser.id,
      status: "ACTIVE",
      plan: "TEAMS",
      billingCycle: "yearly",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date("2099-12-31T23:59:59.999Z"),
      cancelAtPeriodEnd: false,
    },
  });

  // Seed UserQuotaOverride for unlimited rounds
  const existingOverride = await prisma.userQuotaOverride.findFirst({
    where: { userId: candidateUser.id, featureKey: "monthly_rounds_limit" },
  });
  if (!existingOverride) {
    await prisma.userQuotaOverride.create({
      data: {
        userId: candidateUser.id,
        featureKey: "monthly_rounds_limit",
        overrideValue: { unlimited: true, bonusRounds: 9999 },
        reason: "VIP Testing Account All-Access",
      },
    });
  }

  console.log("Users and VIP entitlements seeded successfully.");
}
