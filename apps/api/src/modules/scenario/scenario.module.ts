import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { ScenarioController } from "./controllers/scenario.controller";
import { ScenarioService } from "./services/scenario.service";

@Module({
  imports: [PrismaModule],
  controllers: [ScenarioController],
  providers: [ScenarioService],
  exports: [ScenarioService],
})
export class ScenarioModule {}
