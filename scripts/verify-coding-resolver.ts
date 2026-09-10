import { PrismaClient } from "@prisma/client";
import { CodingContextResolverService } from "../apps/api/src/modules/coding/services/coding-context-resolver.service";

const directUrl =
  process.env.DIRECT_URL ||
  "postgresql://postgres.ayklmzeqfezrlbkdusqc:MARVEL7ace%4077090@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } },
});

async function main() {
  console.log("=== TESTING CODING CONTEXT RESOLVER ===");
  const resolver = new CodingContextResolverService(prisma as any);

  // Test with candidate test instance
  const testInstanceId = "f8tye95fb0tp143mdcyweqf7";
  const questionId = "cmt4bkdi4001ntcvtrs9r8029";

  const instance = await prisma.testInstance.findUnique({ where: { id: testInstanceId } });
  const mockUser: any = { id: instance?.userId, role: "CANDIDATE" };

  const ctx = await resolver.resolveContext(questionId, testInstanceId, mockUser);
  console.log("Resolved Context successfully!");
  console.log("Question ID:", ctx.question.id);
  console.log("Has codingData:", !!ctx.codingData);
  console.log("Public tests count:", ctx.codingData.publicTests?.length);
  console.log("Hidden tests count:", ctx.codingData.hiddenTests?.length);
  console.log("Starter code languages:", Object.keys(ctx.codingData.starterCode || {}));

  // Test question 2
  const question2Id = "cmt4bkehh001ptcvtwtptkhf8";
  const ctx2 = await resolver.resolveContext(question2Id, testInstanceId, mockUser);
  console.log("\nResolved Question 2 successfully!");
  console.log("Question 2 ID:", ctx2.question.id);
  console.log("Has codingData:", !!ctx2.codingData);
  console.log("Public tests count:", ctx2.codingData.publicTests?.length);
  console.log("Hidden tests count:", ctx2.codingData.hiddenTests?.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
