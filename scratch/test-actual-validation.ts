import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../packages/database/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { SystemValidationResponseSchema } from '@intervu-ai/contracts';

const prisma = new PrismaClient();

async function main() {
  const configId = 'cmsifafam000099s9csfe33pg';
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('../apps/api/src/app.module');
  const { QuestionBankSource } = await import('../apps/api/src/modules/assembly/services/question-bank-source');
  const { QuestionRotationService } = await import('../apps/api/src/modules/question-bank/services/question-rotation.service');

  console.log('Bootstrapping Nest context...');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  console.log('--- Testing full validateGenerationPrerequisites ---');
  const tStart = Date.now();
  const { CrossModuleValidatorService } = await import('../apps/api/src/modules/validation/services/cross-module-validator.service');
  const validator = app.get(CrossModuleValidatorService);
  const result = await validator.validateGenerationPrerequisites(configId);
  console.log(`validateGenerationPrerequisites completed in ${Date.now() - tStart}ms! Valid: ${result.valid}, Errors count: ${result.errors.length}`);

  await app.close();
}

main().catch(console.error).finally(() => prisma.$disconnect());
