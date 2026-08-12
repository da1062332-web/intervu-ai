import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma/prisma.service';
import { CandidateDashboardRepository } from './src/modules/candidate/repositories/candidate-dashboard.repository';
import { PublicTestsRepository } from './src/modules/candidate/repositories/public-tests.repository';
import { EligibilityService } from './src/modules/lifecycle/eligibility.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const dashboardRepo = app.get(CandidateDashboardRepository);
  const publicTestsRepo = app.get(PublicTestsRepository);
  const eligibilityService = app.get(EligibilityService);

  console.log('--- Setting up Test Data ---');
  // 1. Create a mock user
  const user = await prisma.user.create({
    data: {
      email: `test-candidate-${Date.now()}@example.com`,
      fullName: 'Test Candidate',
      role: 'CANDIDATE',
    }
  });

  // 2. Create 3 ExamConfigs: DRAFT, VALIDATED, PUBLISHED
  const common = { isActive: true, durationMinutes: 60, role: 'developer', totalQuestions: 10 };
  const draftConfig = await prisma.examConfig.create({
    data: { ...common, name: 'Draft Test', status: 'DRAFT', code: `DRAFT-${Date.now()}` }
  });
  const validatedConfig = await prisma.examConfig.create({
    data: { ...common, name: 'Validated Test', status: 'VALIDATED', code: `VAL-${Date.now()}` }
  });
  const publishedConfig = await prisma.examConfig.create({
    data: { ...common, name: 'Published Test', status: 'PUBLISHED', code: `PUB-${Date.now()}` }
  });

  console.log(`Created DRAFT: ${draftConfig.id}`);
  console.log(`Created VALIDATED: ${validatedConfig.id}`);
  console.log(`Created PUBLISHED: ${publishedConfig.id}`);

  // 3. Test Candidate Dashboard (Should only return PUBLISHED)
  console.log('\n--- Testing Candidate Dashboard (dashboardRepo.getDashboardData) ---');
  const dashboardData = await dashboardRepo.getDashboardData(user.id) as any;
  const allDashboardItems = [...(dashboardData.availableTests || [])];
  const availableExams = allDashboardItems.filter((t: any) => 
    t.id === draftConfig.id || t.id === validatedConfig.id || t.id === publishedConfig.id
  );
  console.log('Dashboard Available Tests Found:', availableExams.map((t: any) => ({ id: t.id, name: t.name || t.title })));

  // 4. Test Public Tests Catalog (Should only return PUBLISHED)
  console.log('\n--- Testing Public Catalog (publicTestsRepo.findPublicTests) ---');
  const catalogData = await publicTestsRepo.findPublicTests({ userId: user.id, take: 100, skip: 0, sortOrder: 'desc', sortBy: 'createdAt' });
  const catalogExams = catalogData.items.filter((t: any) => 
    t.id === draftConfig.id || t.id === validatedConfig.id || t.id === publishedConfig.id
  );
  console.log('Catalog Tests Found:', catalogExams.map((t: any) => ({ id: t.id, name: t.name })));

  // 5. Test Start Assessment (EligibilityService)
  console.log('\n--- Testing Eligibility (Start Assessment) ---');
  const draftEligible = await eligibilityService.validateEligibility(user.id, draftConfig.id);
  console.log(`Draft Eligibility:`, draftEligible);
  
  const validatedEligible = await eligibilityService.validateEligibility(user.id, validatedConfig.id);
  console.log(`Validated Eligibility:`, validatedEligible);

  const publishedEligible = await eligibilityService.validateEligibility(user.id, publishedConfig.id);
  console.log(`Published Eligibility:`, publishedEligible);

  // Cleanup
  console.log('\n--- Cleaning up ---');
  await prisma.examConfig.deleteMany({
    where: { id: { in: [draftConfig.id, validatedConfig.id, publishedConfig.id] } }
  });
  await prisma.user.delete({ where: { id: user.id } });

  await app.close();
}

bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});
