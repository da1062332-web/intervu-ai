import { Module, forwardRef } from "@nestjs/common";
import { QuestionBankController } from "./controllers/question-bank.controller";
import { QuestionsController } from "./controllers/questions.controller";
import { ManualQuestionsController } from "./controllers/manual-questions.controller";
import { QuestionBankService } from "./services/question-bank.service";
import { QuestionSearchService } from "./services/question-search.service";
import { QuestionVersionService } from "./services/question-version.service";
import { QuestionReviewService } from "./services/question-review.service";
import { QuestionSimilarityService } from "./services/question-similarity.service";
import { QuestionReservationService } from "./services/question-reservation.service";
import { QuestionRotationService } from "./services/question-rotation.service";
import { QuestionUsageService } from "./services/question-usage.service";
import { QuestionRepository } from "./repositories/question.repository";
import { QuestionVersionRepository } from "./repositories/question-version.repository";
import { QuestionReviewRepository } from "./repositories/question-review.repository";
import { TemplateLibraryModule } from "../template-library/template-library.module";

@Module({
  imports: [forwardRef(() => TemplateLibraryModule)],
  controllers: [QuestionBankController, QuestionsController, ManualQuestionsController],
  providers: [
    QuestionBankService,
    QuestionSearchService,
    QuestionVersionService,
    QuestionReviewService,
    QuestionSimilarityService,
    QuestionReservationService,
    QuestionRotationService,
    QuestionUsageService,
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
    QuestionReservationService,
    QuestionRotationService,
    QuestionUsageService,
    QuestionRepository,
    QuestionVersionRepository,
    QuestionReviewRepository,
  ],
})
export class QuestionBankModule {}
