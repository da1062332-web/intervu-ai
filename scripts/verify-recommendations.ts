import { PrismaService } from "../apps/api/src/prisma/prisma.service";
import { EvaluationRepository } from "../apps/api/src/modules/results/repositories/evaluation.repository";
import { RecommendationRepository } from "../apps/api/src/modules/results/repositories/recommendation.repository";
import { ResultsService } from "../apps/api/src/modules/results/services/results.service";
import { RecommendationsService } from "../apps/api/src/modules/results/services/recommendations.service";
import { createId } from "@paralleldrive/cuid2";

async function run() {
  console.log("==========================================");
  console.log("Starting Recommendations Verification");
  console.log("==========================================\n");

  const prisma = new PrismaService();
  const evaluationRepository = new EvaluationRepository(prisma);
  const recommendationRepository = new RecommendationRepository(prisma);
  const resultsService = new ResultsService(evaluationRepository);
  const recommendationsService = new RecommendationsService(
    recommendationRepository,
    resultsService,
  );

  let userId: string | null = null;
  let templateId: string | null = null;
  let testId: string | null = null;
  let evaluationId: string | null = null;

  try {
    await prisma.$connect();

    // 1. Create User
    const user = await prisma.user.create({
      data: {
        email: `verify_rec_${createId()}@example.com`,
        passwordHash: "dummyhash",
        fullName: "Recommendations Candidate",
        role: "CANDIDATE",
      },
    });
    userId = user.id;

    // 2. Create Template
    const template = await prisma.template.create({
      data: {
        templateKey: `verify_rec_tpl_${createId()}`,
        conceptKey: "rec_concept",
        difficultyLevel: "MEDIUM",
        questionType: "mcq",
        name: "Recommendations Integration Template",
      },
    });
    templateId = template.id;

    // 3. Create Test
    const test = await prisma.test.create({
      data: {
        userId: userId,
        templateId: templateId,
        status: "COMPLETED",
      },
    });
    testId = test.id;

    // 4. Create EvaluationResult and nested recommendations
    const evaluation = await prisma.evaluationResult.create({
      data: {
        testId: testId,
        userId: userId,
        communicationScore: 80.0,
        technicalScore: 88.0,
        confidenceScore: 90.0,
        overallScore: 85.0,
        overallRating: 4.5,
        recommendations: {
          create: [
            {
              skill: "Node.js",
              priority: "MEDIUM",
              title: "Improve async/await error handling",
              description: "Read documentation on async error handling",
            },
            {
              skill: "TypeScript",
              priority: "HIGH",
              title: "Understand advanced type systems",
              description:
                "Learn about union/intersection types and mapped types",
            },
            {
              skill: "Databases",
              priority: "LOW",
              title: "Optimize index utilization",
              description: "Learn about PostgreSQL indexes and EXPLAIN ANALYZE",
            },
          ],
        },
      },
    });
    evaluationId = evaluation.id;

    console.log(`Setup complete. User: ${userId}, Evaluation: ${evaluationId}`);

    // 5. Invoke getRecommendations
    console.log("Invoking recommendationsService.getRecommendations...");
    const recs = await recommendationsService.getRecommendations(
      userId,
      evaluationId,
    );

    // Assertions
    if (!recs || recs.length !== 3) {
      throw new Error(`Expected 3 recommendations, got ${recs?.length}`);
    }

    // Verify priority sorting (HIGH -> MEDIUM -> LOW)
    console.log("Verifying priority sorting (HIGH -> MEDIUM -> LOW)...");
    if (recs[0].priority !== "HIGH")
      throw new Error(
        `Expected first recommendation priority to be HIGH, got ${recs[0].priority}`,
      );
    if (recs[1].priority !== "MEDIUM")
      throw new Error(
        `Expected second recommendation priority to be MEDIUM, got ${recs[1].priority}`,
      );
    if (recs[2].priority !== "LOW")
      throw new Error(
        `Expected third recommendation priority to be LOW, got ${recs[2].priority}`,
      );

    // Verify skill mapping
    console.log("Verifying skill gaps mapping...");
    if (recs[0].skill !== "TypeScript")
      throw new Error(
        `Expected HIGH priority skill to be TypeScript, got ${recs[0].skill}`,
      );
    if (recs[1].skill !== "Node.js")
      throw new Error(
        `Expected MEDIUM priority skill to be Node.js, got ${recs[1].skill}`,
      );
    if (recs[2].skill !== "Databases")
      throw new Error(
        `Expected LOW priority skill to be Databases, got ${recs[2].skill}`,
      );

    // Verify description and title
    console.log("Verifying description and title values...");
    if (
      recs[0].title !== "Understand advanced type systems" ||
      recs[0].description !==
        "Learn about union/intersection types and mapped types"
    ) {
      throw new Error("HIGH priority title or description mismatch");
    }

    // Verify uniqueness (No duplicate IDs or duplicate skills)
    console.log("Verifying uniqueness constraints...");
    const ids = recs.map((r) => r.id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== recs.length) {
      throw new Error("Duplicate recommendation IDs found");
    }

    const skills = recs.map((r) => r.skill);
    const uniqueSkills = new Set(skills);
    if (uniqueSkills.size !== recs.length) {
      throw new Error("Duplicate skills in recommendations found");
    }

    // 6. Invoke getHighPriorityRecommendations
    console.log(
      "Invoking recommendationsService.getHighPriorityRecommendations...",
    );
    const highRecs =
      await recommendationsService.getHighPriorityRecommendations(
        userId,
        evaluationId,
      );
    if (
      highRecs.length !== 1 ||
      highRecs[0].priority !== "HIGH" ||
      highRecs[0].skill !== "TypeScript"
    ) {
      throw new Error(
        `High priority recommendations filter failed. Expected 1 TypeScript HIGH recommendation, got ${JSON.stringify(highRecs)}`,
      );
    }

    console.log("Recommendations verification: PASS");

    console.log("\n==========================================");
    console.log("RECOMMENDATIONS PASS");
    console.log("==========================================\n");
    process.exit(0);
  } catch (err: any) {
    console.error("\n==========================================");
    console.error("RECOMMENDATIONS FAIL");
    console.error(err.message || err);
    console.error("==========================================\n");
    process.exit(1);
  } finally {
    // Teardown
    console.log("Starting teardown...");
    if (evaluationId) {
      await prisma.recommendation
        .deleteMany({ where: { evaluationId } })
        .catch(() => {});
      await prisma.evaluationResult
        .delete({ where: { id: evaluationId } })
        .catch(() => {});
    }
    if (testId) {
      await prisma.test.delete({ where: { id: testId } }).catch(() => {});
    }
    if (templateId) {
      await prisma.template
        .delete({ where: { id: templateId } })
        .catch(() => {});
    }
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

run();
