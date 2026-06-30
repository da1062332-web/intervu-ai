import { Module } from "@nestjs/common";
import { QuestionPoolService } from "./services/question-pool.service";
import { GeneratedQuestionRepository } from "./repositories/generated-question.repository";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [QuestionPoolService, GeneratedQuestionRepository],
  exports: [QuestionPoolService, GeneratedQuestionRepository],
})
export class QuestionPoolModule {}
