import { Module } from "@nestjs/common";
import { QuestionBankController } from "./controllers/question-bank.controller";
import { QuestionBankService } from "./services/question-bank.service";
import { QuestionSearchService } from "./services/question-search.service";
import { QuestionVersionService } from "./services/question-version.service";
import { QuestionReviewService } from "./services/question-review.service";
import { QuestionSimilarityService } from "./services/question-similarity.service";
import { QuestionRepository } from "./repositories/question.repository";
import { QuestionVersionRepository } from "./repositories/question-version.repository";
import { QuestionReviewRepository } from "./repositories/question-review.repository";

@Module({
  controllers: [QuestionBankController],
  providers: [
    QuestionBankService,
    QuestionSearchService,
    QuestionVersionService,
    QuestionReviewService,
    QuestionSimilarityService,
    QuestionRepository,
    QuestionVersionRepository,
    QuestionReviewRepository,
  ],
  exports: [
    QuestionBankService,
    QuestionSearchService,
    QuestionVersionService,
    QuestionReviewService,
    QuestionSimilarityService,
    QuestionRepository,
    QuestionVersionRepository,
    QuestionReviewRepository,
  ],
})
export class QuestionBankModule {}
