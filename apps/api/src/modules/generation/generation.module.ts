import { Module } from '@nestjs/common';
import { GenerationService } from './services/generation.service';
import { GenerationController } from './controllers/generation.controller';

/**
 * GenerationModule — orchestrates question generation workflows.
 *
 * Depends on:
 *  - QueueModule (global) — for enqueuing BullMQ jobs
 *  - CacheModule (global) — for polling generation results
 *
 * Both are global modules registered in AppModule, so no explicit
 * import is required here.
 */
@Module({
  controllers: [GenerationController],
  providers: [GenerationService],
  exports: [GenerationService],
})
export class GenerationModule {}
