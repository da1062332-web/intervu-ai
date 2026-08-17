import { NestFactory } from '@nestjs/core';
import { AppModule } from './apps/api/src/app.module';
import { CodingPatternService } from './apps/api/src/modules/coding/services/coding-pattern.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const patternService = app.get(CodingPatternService);
  
  const uniqueSlug = `test-auto-gen-${Date.now()}`;
  console.log(`Creating pattern: ${uniqueSlug}`);
  
  const pattern = await patternService.createPattern({
    title: 'Auto Generation Test',
    slug: uniqueSlug,
    description: 'Testing if creating a pattern auto-generates a question',
    difficulty: 'MEDIUM',
    status: 'DRAFT',
    oracleKey: 'MATH_PRIME_CHECK_ORACLE', // standard oracle
  });
  
  console.log('Pattern created:', pattern.id);
  
  // Wait a few seconds for the async listener to finish
  console.log('Waiting 10 seconds for AI generation...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  await app.close();
}

bootstrap().catch(console.error);
