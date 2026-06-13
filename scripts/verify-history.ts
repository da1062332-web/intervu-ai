import { PrismaService } from "../apps/api/src/prisma/prisma.service";
import { EvaluationRepository } from "../apps/api/src/modules/results/repositories/evaluation.repository";
import { PerformanceRepository } from "../apps/api/src/modules/results/repositories/performance.repository";
import { PerformanceService } from "../apps/api/src/modules/results/services/performance.service";
import { createId } from "@paralleldrive/cuid2";

async function run() {
  console.log("==========================================");
  console.log("Starting Assessment History Verification");
  console.log("==========================================\n");

  const prisma = new PrismaService();
  const evaluationRepository = new EvaluationRepository(prisma);
  const performanceRepository = new PerformanceRepository(prisma);
  const performanceService = new PerformanceService(performanceRepository, evaluationRepository);

  let userId: string | null = null;
  const templateIds: string[] = [];
  const testIds: string[] = [];
  const evaluationIds: string[] = [];

  try {
    await prisma.$connect();

    // 1. Create User
    const user = await prisma.user.create({
      data: {
        email: `verify_hist_${createId()}@example.com`,
        passwordHash: "dummyhash",
        fullName: "History Candidate",
        role: "CANDIDATE",
      },
    });
    userId = user.id;

    // 2. Create 3 templates, tests, and evaluations
    const assessmentNames = ["Assessment Alpha", "Assessment Beta", "Assessment Gamma"];
    const overallScores = [75.0, 85.0, 95.0];

    for (let i = 0; i < 3; i++) {
      const template = await prisma.template.create({
        data: {
          templateKey: `verify_hist_tpl_${i}_${createId()}`,
          conceptKey: `concept_${i}`,
          difficultyLevel: "MEDIUM",
          questionType: "mcq",
          name: assessmentNames[i],
        },
      });
      templateIds.push(template.id);

      const test = await prisma.test.create({
        data: {
          userId: userId,
          templateId: template.id,
          status: "COMPLETED",
        },
      });
      testIds.push(test.id);

      const evaluation = await prisma.evaluationResult.create({
        data: {
          testId: test.id,
          userId: userId,
          communicationScore: 80.0,
          technicalScore: 88.0,
          confidenceScore: 90.0,
          overallScore: overallScores[i],
          overallRating: 4.5,
          evaluatedAt: new Date(Date.now() - (3 - i) * 3600000), // Chronological order: Alpha, Beta, Gamma
        },
      });
      evaluationIds.push(evaluation.id);
    }

    console.log(`Setup complete. User: ${userId}, Evaluations: ${evaluationIds.join(", ")}`);

    // 3. Test pagination: page=1, limit=10
    console.log("Invoking performanceService.getHistory with page=1, limit=10...");
    const history = await performanceService.getHistory(userId, { page: 1, limit: 10 });

    // Assertions on structure and pagination boundaries
    if (!history || !history.items) {
      throw new Error("History response or items not defined");
    }

    console.log("Verifying pagination boundaries...");
    if (history.total !== 3) throw new Error(`Expected total 3, got ${history.total}`);
    if (history.page !== 1) throw new Error(`Expected page 1, got ${history.page}`);
    if (history.limit !== 10) throw new Error(`Expected limit 10, got ${history.limit}`);
    if (history.totalPages !== 1) throw new Error(`Expected totalPages 1, got ${history.totalPages}`);
    if (history.hasNext !== false) throw new Error(`Expected hasNext false, got ${history.hasNext}`);
    if (history.hasPrevious !== false) throw new Error(`Expected hasPrevious false, got ${history.hasPrevious}`);

    // Verify ordering is descending by evaluatedAt (most recent first: Gamma -> Beta -> Alpha)
    console.log("Verifying chronological ordering (descending)...");
    if (history.items[0].overallScore !== 95.0) throw new Error(`Expected first item overallScore 95.0 (Gamma), got ${history.items[0].overallScore}`);
    if (history.items[1].overallScore !== 85.0) throw new Error(`Expected second item overallScore 85.0 (Beta), got ${history.items[1].overallScore}`);
    if (history.items[2].overallScore !== 75.0) throw new Error(`Expected third item overallScore 75.0 (Alpha), got ${history.items[2].overallScore}`);

    // Verify DTO structure and query template name ("Assessment Name") from DB for each item
    console.log("Verifying items structure and associated assessment names...");
    for (const item of history.items) {
      if (!item.evaluationId || !item.testId || item.overallScore === undefined || !item.evaluatedAt) {
        throw new Error(`Invalid history item structure: ${JSON.stringify(item)}`);
      }

      // Query database for template name associated with this item's testId
      const testRecord = await prisma.test.findUnique({
        where: { id: item.testId },
        include: { template: true },
      });

      if (!testRecord || !testRecord.template) {
        throw new Error(`Test or Template not found in DB for testId: ${item.testId}`);
      }

      const expectedName =
        item.overallScore === 95.0
          ? "Assessment Gamma"
          : item.overallScore === 85.0
            ? "Assessment Beta"
            : "Assessment Alpha";

      if (testRecord.template.name !== expectedName) {
        throw new Error(`Assessment name mismatch. Expected ${expectedName}, got ${testRecord.template.name}`);
      }
      console.log(`Verified mapping for ${expectedName}`);
    }

    // 4. Test pagination page boundaries: page=1, limit=2
    console.log("Invoking performanceService.getHistory with page=1, limit=2...");
    const paginated1 = await performanceService.getHistory(userId, { page: 1, limit: 2 });
    if (paginated1.items.length !== 2) throw new Error(`Expected 2 items, got ${paginated1.items.length}`);
    if (paginated1.totalPages !== 2) throw new Error(`Expected 2 totalPages, got ${paginated1.totalPages}`);
    if (paginated1.hasNext !== true) throw new Error(`Expected hasNext true, got ${paginated1.hasNext}`);
    if (paginated1.hasPrevious !== false) throw new Error(`Expected hasPrevious false, got ${paginated1.hasPrevious}`);

    // Test pagination page boundaries: page=2, limit=2
    console.log("Invoking performanceService.getHistory with page=2, limit=2...");
    const paginated2 = await performanceService.getHistory(userId, { page: 2, limit: 2 });
    if (paginated2.items.length !== 1) throw new Error(`Expected 1 item, got ${paginated2.items.length}`);
    if (paginated2.hasNext !== false) throw new Error(`Expected hasNext false, got ${paginated2.hasNext}`);
    if (paginated2.hasPrevious !== true) throw new Error(`Expected hasPrevious true, got ${paginated2.hasPrevious}`);

    console.log("History verification: PASS");

    console.log("\n==========================================");
    console.log("HISTORY PASS");
    console.log("==========================================\n");
    process.exit(0);
  } catch (err: any) {
    console.error("\n==========================================");
    console.error("HISTORY FAIL");
    console.error(err.message || err);
    console.error("==========================================\n");
    process.exit(1);
  } finally {
    // Teardown
    console.log("Starting teardown...");
    for (const evaluationId of evaluationIds) {
      await prisma.evaluationResult.delete({ where: { id: evaluationId } }).catch(() => {});
    }
    for (const testId of testIds) {
      await prisma.test.delete({ where: { id: testId } }).catch(() => {});
    }
    for (const templateId of templateIds) {
      await prisma.template.delete({ where: { id: templateId } }).catch(() => {});
    }
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

run();
