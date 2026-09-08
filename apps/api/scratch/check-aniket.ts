import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Alter subscriptions.plan column in postgres to text
  try {
    console.log("Altering subscriptions.plan column to text...");
    await prisma.$executeRawUnsafe(`ALTER TABLE "subscriptions" ALTER COLUMN "plan" TYPE text USING "plan"::text;`);
    console.log("Successfully altered subscriptions.plan column to text!");
  } catch (err: any) {
    console.log("Alter error / already altered:", err.message);
  }

  // Also check payment_transactions.plan or plans table if any
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "payment_transactions" ALTER COLUMN "plan" TYPE text USING "plan"::text;`);
  } catch {}

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { fullName: { contains: 'Aniket', mode: 'insensitive' } },
        { email: { contains: 'Aniket', mode: 'insensitive' } },
        { fullName: { contains: 'Patil', mode: 'insensitive' } },
      ],
    },
    include: {
      subscription: true,
      quotaOverrides: true,
      ownedReferralCodes: true,
      referralRedemptions: true,
      referralsSent: true,
      referralsReceived: true,
      testInstances: {
        select: {
          id: true,
          status: true,
          examConfigId: true,
          testConfigId: true,
          createdAt: true,
        },
      },
    },
  });

  console.log(`Found ${users.length} users matching 'Aniket' / 'Patil':`);
  for (const u of users) {
    console.log(JSON.stringify(u, null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
