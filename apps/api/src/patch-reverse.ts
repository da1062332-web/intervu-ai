import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  
  try {
    const reverseCodingData = {
      oracleKey: null,
      publicTests: [
        { input: { s: "hello" }, expectedOutput: { result: "olleh" } },
        { input: { s: "world" }, expectedOutput: { result: "dlrow" } }
      ],
      hiddenTests: [
        { input: { s: "racecar" }, expectedOutput: { result: "racecar" } },
        { input: { s: "intervu" }, expectedOutput: { result: "uvretni" } }
      ],
      boundaryTests: [
        { input: { s: "" }, expectedOutput: { result: "" } },
        { input: { s: "a" }, expectedOutput: { result: "a" } }
      ],
      stressTests: [
        { input: { s: "a".repeat(100) }, expectedOutput: { result: "a".repeat(100) } }
      ]
    };

    // 1. Patch the Question
    const questions = await prisma.question.findMany({
      where: {
        questionText: { contains: "olleh", mode: "insensitive" }
      }
    });

    console.log(`Found ${questions.length} questions to patch.`);
    for (const q of questions) {
      await prisma.question.update({
        where: { id: q.id },
        data: { codingData: reverseCodingData }
      });
      console.log(`Patched Question ${q.id}`);
    }

    // 2. Patch the TestInstanceQuestions
    const tiqs = await prisma.testInstanceQuestion.findMany({
      where: {
        questionSnapshot: { path: ['questionText'], string_contains: "olleh" }
      }
    });

    console.log(`Found ${tiqs.length} test instance questions to patch.`);
    for (const tiq of tiqs) {
      const snapshot: any = tiq.questionSnapshot || {};
      snapshot.codingData = reverseCodingData;
      await prisma.testInstanceQuestion.update({
        where: { id: tiq.id },
        data: { questionSnapshot: snapshot }
      });
      console.log(`Patched TestInstanceQuestion ${tiq.id}`);
    }
  } catch (err) {
    console.error("Error patching:", err);
  }

  await app.close();
}
bootstrap();
