require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reports = await prisma.readinessReport.findMany({
    where: { configId: 'cmsifafam000099s9csfe33pg' },
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  if (reports.length > 0) {
    const report = reports[0];
    console.log(JSON.stringify(report.report, null, 2));
  } else {
    console.log('No readiness report found.');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
