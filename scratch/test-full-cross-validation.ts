import { NestFactory } from '@nestjs/core';
import { AppModule } from '../apps/api/src/app.module';
import { CrossModuleValidatorService } from '../apps/api/src/modules/validation/services/cross-module-validator.service';

async function main() {
  const configId = 'cmsifafam000099s9csfe33pg';
  console.log(`Bootstrapping Nest context to test CrossModuleValidatorService for ${configId}...`);
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const validatorService = app.get(CrossModuleValidatorService);

  const start = Date.now();
  console.log(`Executing validateGenerationPrerequisites(${configId})...`);
  const result = await validatorService.validateGenerationPrerequisites(configId);
  const duration = Date.now() - start;

  console.log(`\n================================================================`);
  console.log(`Validation completed in: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
  console.log(`Valid: ${result.valid}`);
  console.log(`Score: ${result.score}`);
  console.log(`Error Count: ${result.errors.length}`);
  console.log(`Breakdown:`, JSON.stringify(result.breakdown, null, 2));
  console.log(`================================================================`);

  await app.close();
}

main().catch(console.error);
