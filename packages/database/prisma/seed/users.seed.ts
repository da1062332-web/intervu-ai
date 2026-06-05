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
  await prisma.user.upsert({
    where: { email: "candidate@intervu.ai" },
    update: {},
    create: {
      email: "candidate@intervu.ai",
      passwordHash,
      fullName: "John Doe",
      role: UserRole.CANDIDATE,
    },
  });

  console.log("Users seeded successfully.");
}
