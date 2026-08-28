import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function auditAllCodingQuestionsDeep() {
  const codingQuestions = await prisma.question.findMany({
    where: { questionType: "CODING" }
  });

  console.log(`Auditing all ${codingQuestions.length} coding questions in Question table...`);
  const mismatched: any[] = [];

  for (const q of codingQuestions) {
    const cd = (q.codingData || {}) as any;
    const pub = (cd.publicTests || [])[0]?.input;
    const hid = (cd.hiddenTests || [])[0]?.input;
    const text = q.questionText || "";

    const pubStr = JSON.stringify(pub || {});
    const hidStr = JSON.stringify(hid || {});

    // Check if test cases have generic placeholders like "query" or "dummy" or "sample"
    const isPlaceholder = pubStr.includes('"query"') || hidStr.includes('"query"') || pubStr.includes('"sample"') || hidStr.includes('"sample"');

    if (isPlaceholder) {
      mismatched.push({
        id: q.id,
        title: q.questionTitle,
        textSnippet: text.substring(0, 100).replace(/\n/g, " "),
        pubSample: pub,
        hidSample: hid
      });
    }
  }

  console.log(`\nFound ${mismatched.length} coding questions with placeholder test cases!`);
  for (const m of mismatched) {
    console.log(`\nID: ${m.id} | Title: ${m.title}`);
    console.log(`  Text: ${m.textSnippet}`);
    console.log(`  Pub:`, JSON.stringify(m.pubSample));
    console.log(`  Hid:`, JSON.stringify(m.hidSample));
  }
}

auditAllCodingQuestionsDeep().catch(console.error).finally(() => prisma.$disconnect());
