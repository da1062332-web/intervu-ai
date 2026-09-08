import { PrismaClient } from '@prisma/client';
import { CandidateDashboardRepository } from '../apps/api/src/modules/candidate/repositories/candidate-dashboard.repository';
import { CandidateDashboardService } from '../apps/api/src/modules/candidate/services/candidate-dashboard.service';
import { EntitlementService } from '../apps/api/src/modules/billing/services/entitlement.service';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'aniketpatil6448@gmail.com' } });
  if (!user) {
    console.log('User not found');
    return;
  }
  console.log('Testing metrics for user:', user.id, user.fullName);
  const repo = new CandidateDashboardRepository(prisma as any, { get: () => null, set: () => {} } as any);
  const entitlementService = new EntitlementService(prisma as any, null as any, null as any);
  const service = new CandidateDashboardService(repo, entitlementService);

  const metrics = await service.getDashboardMetrics(user.id);
  console.log('Metrics result:', JSON.stringify(metrics, null, 2));

  const dashboardData = await service.getDashboardData(user.id);
  console.log('Dashboard Data completedTests count:', dashboardData.completedTests.length);
  console.log('Dashboard Data upcomingTests count:', dashboardData.upcomingTests.length);
  console.log('Dashboard Data recommendedTests count:', dashboardData.recommendedTests.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
