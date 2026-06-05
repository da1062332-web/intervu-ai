import { Module } from '@nestjs/common';
import { EvaluationController } from './controllers/evaluation.controller';
import { EvaluationService } from './services/evaluation.service';

@Module({
  controllers: [EvaluationController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
