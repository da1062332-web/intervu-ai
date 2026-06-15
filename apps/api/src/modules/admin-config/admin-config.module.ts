import { Module } from "@nestjs/common";
import { ExamConfigController } from "./controllers/exam-config.controller";
import { ExamConfigService } from "./services/exam-config.service";
import { ExamConfigRepository } from "./repositories/exam-config.repository";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ExamConfigController],
  providers: [ExamConfigService, ExamConfigRepository],
  exports: [ExamConfigService, ExamConfigRepository],
})
export class AdminConfigModule {}
