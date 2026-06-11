import { Module } from "@nestjs/common";
import { QuestionPoolService } from "./services/question-pool.service";

@Module({
  providers: [QuestionPoolService],
  exports: [QuestionPoolService],
})
export class QuestionPoolModule {}
