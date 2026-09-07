import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const campaigns = await prisma.referralCampaign.findMany();
  console.log("Campaigns in DB:", JSON.stringify(campaigns, null, 2));
}

main().finally(() => prisma.$disconnect());
