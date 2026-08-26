import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function sqlCheckCodingTypes() {
  console.log("==================================================");
  console.log("SQL FAST AUDIT OF CODING QUESTION SNAPSHOT TYPES");
  console.log("==================================================");

  // Check count of misclassified in AssembledTestQuestion (assembled_test_questions)
  const atqMisclassified: any[] = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count
    FROM "assembled_test_questions" atq
    JOIN "assembled_test_sections" ats ON atq."section_id" = ats.id
    WHERE (LOWER(ats."section_name") LIKE '%coding%' OR atq."question_snapshot"->>'codingData' IS NOT NULL)
      AND atq."question_snapshot"->>'questionType' != 'CODING';
  `;
  console.log(`AssembledTestQuestion (assembled_test_questions) misclassified count: ${atqMisclassified[0]?.count}`);

  // Check count of misclassified in TestInstanceQuestion
  const tiqMisclassified: any[] = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count
    FROM "TestInstanceQuestion" tiq
    JOIN "TestInstanceSection" tis ON tiq."sectionId" = tis.id
    WHERE (LOWER(tis."sectionName") LIKE '%coding%' OR tiq."questionSnapshot"->>'codingData' IS NOT NULL)
      AND tiq."questionSnapshot"->>'questionType' != 'CODING';
  `;
  console.log(`TestInstanceQuestion misclassified count: ${tiqMisclassified[0]?.count}`);

  // Check sample coding rows in assembled_test_questions
  const samples: any[] = await prisma.$queryRaw`
    SELECT 
      atq.id,
      atq.question_order as "questionOrder",
      ats.section_name as "sectionName",
      atq.question_snapshot->>'questionType' as "snapQuestionType",
      SUBSTRING(atq.question_snapshot->>'questionText', 1, 50) as "text"
    FROM "assembled_test_questions" atq
    JOIN "assembled_test_sections" ats ON atq.section_id = ats.id
    WHERE LOWER(ats.section_name) LIKE '%coding%'
    ORDER BY atq.created_at DESC, atq.question_order ASC
    LIMIT 6;
  `;
  console.log(`\nSample AssembledTestQuestions in Coding sections:`);
  for (const s of samples) {
    console.log(`  Order: Q${s.questionOrder} | Section: ${s.sectionName} | Type: ${s.snapQuestionType} | Text: ${s.text}...`);
  }
}

sqlCheckCodingTypes().catch(console.error).finally(() => prisma.$disconnect());
