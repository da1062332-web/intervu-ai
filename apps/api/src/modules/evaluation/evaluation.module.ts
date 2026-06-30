import { Module } from "@nestjs/common";
import { EvaluationController } from "./controllers/evaluation.controller";
import { EvaluationService } from "./services/evaluation.service";
import { EvaluationQueueService } from "./services/evaluation-queue.service";

@Module({
  controllers: [EvaluationController],
  providers: [EvaluationService, EvaluationQueueService],
  exports: [EvaluationService, EvaluationQueueService],
})
export class EvaluationModule {}

