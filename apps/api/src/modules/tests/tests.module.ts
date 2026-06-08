import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { TestsController } from "./controllers/tests.controller";
import { TestsService } from "./services/tests.service";
import { TestsRepository } from "./repositories/tests.repository";

/**
 * TestsModule — candidate-facing test discovery vertical slice.
 *
 * Exposes:
 *   GET /api/v1/tests/configs  — config discovery for dashboard + test selection
 *
 * Completely independent of SystemConfigModule (admin config) and DashboardModule.
 */
@Module({
  imports: [PrismaModule],
  controllers: [TestsController],
  providers: [TestsService, TestsRepository],
  exports: [TestsService],
})
export class TestsModule {}
