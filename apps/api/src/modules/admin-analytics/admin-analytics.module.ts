import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { GenerationAiModule } from "../generation-ai/generation-ai.module";
import { AdminAnalyticsController } from "./controllers/admin-analytics.controller";
import { ContentCoverageService } from "./services/content-coverage.service";
import { AdminAnalyticsSyncService } from "./services/admin-analytics-sync.service";

@Module({
  imports: [PrismaModule, GenerationAiModule],
  controllers: [AdminAnalyticsController],
  providers: [ContentCoverageService, AdminAnalyticsSyncService],
  exports: [ContentCoverageService, AdminAnalyticsSyncService],
})
export class AdminAnalyticsModule {}
