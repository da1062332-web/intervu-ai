import { Module } from "@nestjs/common";
import { DifficultyDistributionController } from "./controllers/difficulty-distribution.controller";
import { DifficultyDistributionService } from "./services/difficulty-distribution.service";
import { DifficultyDistributionRepository } from "./repositories/difficulty-distribution.repository";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [DifficultyDistributionController],
  providers: [DifficultyDistributionService, DifficultyDistributionRepository],
  exports: [DifficultyDistributionService, DifficultyDistributionRepository],
})
export class DifficultyDistributionModule {}
