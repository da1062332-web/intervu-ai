import { Module } from "@nestjs/common";
import { BlueprintConfigController } from "./blueprint-config.controller";
import { BlueprintConfigService } from "./blueprint-config.service";
import { BlueprintConfigRepository } from "./blueprint-config.repository";
import { BlueprintValidatorService } from "./blueprint-validator.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [BlueprintConfigController],
  providers: [
    BlueprintConfigService,
    BlueprintConfigRepository,
    BlueprintValidatorService,
  ],
  exports: [BlueprintConfigService],
})
export class BlueprintConfigModule {}
