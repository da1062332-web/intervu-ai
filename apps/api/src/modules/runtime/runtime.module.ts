import { Module } from "@nestjs/common";
import { RuntimeController } from "./controllers/runtime.controller";
import { RuntimeGeneratorService } from "./services/runtime-generator.service";
import { RuntimeMapperService } from "./services/runtime-mapper.service";
import { RuntimeSecurityService } from "./services/runtime-security.service";
import { LaunchPrecheckService } from "./services/launch-precheck.service";
import { RuntimeValidationService } from "./validation/runtime-validation.service";
import { RuntimeMonitoringService } from "./monitoring/runtime-monitoring.service";
import { RuntimeRepository } from "./repositories/runtime.repository";
import { AssemblyModule } from "../assembly/assembly.module";

@Module({
  imports: [AssemblyModule],
  controllers: [RuntimeController],
  providers: [
    RuntimeGeneratorService,
    RuntimeMapperService,
    RuntimeSecurityService,
    LaunchPrecheckService,
    RuntimeValidationService,
    RuntimeMonitoringService,
    RuntimeRepository,
  ],
  exports: [
    RuntimeGeneratorService,
    LaunchPrecheckService,
    RuntimeSecurityService,
  ],
})
export class RuntimeModule {}
