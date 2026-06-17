import { Module } from "@nestjs/common";
import { RuleFlagsController } from "./controllers/rule-flags.controller";
import { RuleFlagsService } from "./services/rule-flags.service";
import { RuleFlagsRepository } from "./repositories/rule-flags.repository";

@Module({
  controllers: [RuleFlagsController],
  providers: [RuleFlagsService, RuleFlagsRepository],
  exports: [RuleFlagsService],
})
export class RuleFlagsModule {}
