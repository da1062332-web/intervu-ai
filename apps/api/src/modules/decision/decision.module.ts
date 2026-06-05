import { Module } from "@nestjs/common";
import { DecisionController } from "./controllers/decision.controller";
import { DecisionService } from "./services/decision.service";

@Module({
  controllers: [DecisionController],
  providers: [DecisionService],
  exports: [DecisionService],
})
export class DecisionModule {}
