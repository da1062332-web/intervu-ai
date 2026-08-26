import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

async function run() {
  const totalCount = await prisma.question.count();
  console.log(`Total questions in database: ${totalCount}`);

  const byType = await prisma.question.groupBy({
    by: ['questionType'],
    _count: { id: true }
  });
  console.log("By Question Type:", JSON.stringify(byType, null, 2));

  const byTopic = await prisma.topic.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { questions: true }
      }
    }
  });
  console.log("By Topic:", JSON.stringify(byTopic, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
