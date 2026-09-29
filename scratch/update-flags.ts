import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function run() {
  const updated = await prisma.ruleFlags.updateMany({
    where: { examConfigId: "cmsifafam000099s9csfe33pg" },
    data: { poolEnabled: false }
  });
  console.log("Updated ruleFlags:", updated);
}
run().finally(() => prisma.$disconnect());
