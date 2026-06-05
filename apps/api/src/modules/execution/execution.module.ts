import { Module } from '@nestjs/common';
import { ExecutionController } from './controllers/execution.controller';
import { ExecutionService } from './services/execution.service';

@Module({
  controllers: [ExecutionController],
  providers: [ExecutionService],
  exports: [ExecutionService],
})
export class ExecutionModule {}
