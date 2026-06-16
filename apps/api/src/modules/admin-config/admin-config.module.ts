import { Module } from "@nestjs/common";
import { ExamConfigController } from "./controllers/exam-config.controller";
import { ExamConfigService } from "./services/exam-config.service";
import { ExamConfigRepository } from "./repositories/exam-config.repository";
import { ExamSectionController } from "./controllers/exam-section.controller";
import { ExamSectionService } from "./services/exam-section.service";
import { ExamSectionRepository } from "./repositories/exam-section.repository";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ExamConfigController, ExamSectionController],
  providers: [
    ExamConfigService,
    ExamConfigRepository,
    ExamSectionService,
    ExamSectionRepository,
  ],
  exports: [
    ExamConfigService,
    ExamConfigRepository,
    ExamSectionService,
    ExamSectionRepository,
  ],
})
export class AdminConfigModule {}
