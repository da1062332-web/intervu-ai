import { Module } from "@nestjs/common";
import { LifecycleModule } from "../lifecycle/lifecycle.module";

import { CandidateDashboardRepository } from "./repositories/candidate-dashboard.repository";
import { EnrollmentRepository } from "./repositories/enrollment.repository";
import { PublicTestsRepository } from "./repositories/public-tests.repository";
import { AttemptHistoryRepository } from "./repositories/attempt-history.repository";
import { CandidateProfileRepository } from "./repositories/candidate-profile.repository";

import { CandidateDashboardService } from "./services/candidate-dashboard.service";
import { EnrollmentService } from "./services/enrollment.service";
import { PublicTestsService } from "./services/public-tests.service";
import { AttemptHistoryService } from "./services/attempt-history.service";
import { CandidateProfileService } from "./services/candidate-profile.service";

import { CandidateDashboardController } from "./controllers/candidate-dashboard.controller";
import { EnrollmentController } from "./controllers/enrollment.controller";
import { PublicTestsController } from "./controllers/public-tests.controller";
import { AttemptHistoryController } from "./controllers/attempt-history.controller";
import { CandidateProfileController } from "./controllers/candidate-profile.controller";

@Module({
  imports: [LifecycleModule],
  controllers: [
    CandidateDashboardController,
    EnrollmentController,
    PublicTestsController,
    AttemptHistoryController,
    CandidateProfileController,
  ],
  providers: [
    CandidateDashboardRepository,
    EnrollmentRepository,
    PublicTestsRepository,
    AttemptHistoryRepository,
    CandidateProfileRepository,
    CandidateDashboardService,
    EnrollmentService,
    PublicTestsService,
    AttemptHistoryService,
    CandidateProfileService,
  ],
  exports: [
    CandidateDashboardService,
    EnrollmentService,
    PublicTestsService,
    AttemptHistoryService,
    CandidateProfileService,
  ],
})
export class CandidateModule {}
