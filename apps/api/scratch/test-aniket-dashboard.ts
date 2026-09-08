import { PrismaClient } from '@prisma/client';
import { CandidateDashboardService } from '../src/modules/candidate/services/candidate-dashboard.service';
import { CandidateDashboardRepository } from '../src/modules/candidate/repositories/candidate-dashboard.repository';
import { EntitlementService } from '../src/modules/billing/services/entitlement.service';
import { SubscriptionService } from '../src/modules/billing/services/subscription.service';
import { UsageQuotaService } from '../src/modules/billing/services/usage-quota.service';
import { PlanManagementService } from '../src/modules/billing/services/plan-management.service';

const prisma = new PrismaClient() as any;

async function main() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const mockCache: any = {
    get: async () => null,
    set: async () => {},
    del: async () => {},
  };

  const dashboardRepo = new CandidateDashboardRepository(prisma, mockCache);
  const planManagementService = new PlanManagementService(prisma);
  const subscriptionService = new SubscriptionService(prisma, planManagementService);
  const usageQuotaService = new UsageQuotaService(prisma);
  const entitlementService = new EntitlementService(subscriptionService, usageQuotaService, prisma);

  const dashboardService = new CandidateDashboardService(dashboardRepo, entitlementService);

  const userId = 'cmtmohabq0002ca7uy3qvj658'; // Aniket PAtilq
  const result = await dashboardService.getDashboardData(userId);

  console.log("=== CANDIDATE DASHBOARD DATA FOR ANIKET ===");
  console.log("upcomingTests count:", result.upcomingTests?.length);
  console.log("recommendedTests count:", result.recommendedTests?.length);
  console.log("recommendedTests:", JSON.stringify(result.recommendedTests, null, 2));

  // Simulated frontend allAvailable
  const allAvailable = [...(result.upcomingTests || []), ...(result.recommendedTests || [])].filter(
    (v: any, i: number, a: any[]) => a.findIndex((t) => (t.id || t.configId) === (v.id || v.configId)) === i,
  );
  console.log("Frontend allAvailable count:", allAvailable.length);
  console.log("Frontend allAvailable:", JSON.stringify(allAvailable, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
