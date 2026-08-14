import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  
  try {
    const questions = await prisma.question.findMany({
      where: {
        questionText: { contains: "olleh", mode: "insensitive" }
      }
    });

    console.log(`Found ${questions.length} questions.`);
    for (const q of questions) {
      console.log(`Question ID: ${q.id}`);
      console.log(`Question Text: ${q.questionText}`);
      console.log(`Coding Data: ${JSON.stringify(q.codingData, null, 2)}`);
    }
  } catch (err) {
    console.error(err);
  }

  await app.close();
}
bootstrap();
