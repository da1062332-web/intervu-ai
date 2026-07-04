import { Injectable, Logger } from "@nestjs/common";
import { ExecutionReadyTestDto } from "../../assembly/contracts/execution-ready.contract";
import { RuntimeTestDto } from "../dto/runtime.dto";
import { RuntimeMapperService } from "./runtime-mapper.service";
import { RuntimeValidationService } from "../validation/runtime-validation.service";
import { RuntimeMonitoringService } from "../monitoring/runtime-monitoring.service";

@Injectable()
export class RuntimeGeneratorService {
  private readonly logger = new Logger(RuntimeGeneratorService.name);

  constructor(
    private readonly mapperService: RuntimeMapperService,
    private readonly validationService: RuntimeValidationService,
    private readonly monitoringService: RuntimeMonitoringService,
  ) {}

  async generateRuntime(
    packagedTest: ExecutionReadyTestDto,
  ): Promise<RuntimeTestDto> {
    const startTime = Date.now();
    await this.monitoringService.trackBuildStarted(packagedTest.assemblyId);

    try {
      // 1. Map Assembly DTO to Runtime DTO
      const runtimeTest = this.mapperService.mapPackageToRuntime(packagedTest);

      // 2. Validate Runtime Payload
      const validationStart = Date.now();
      const validationResult = this.validationService.validate(runtimeTest);
      const validationDuration = Date.now() - validationStart;

      if (!validationResult.valid) {
        await this.monitoringService.trackValidationFailed(
          runtimeTest.testId,
          validationResult.errors,
          validationDuration,
        );
        throw new Error(
          `Runtime validation failed: ${validationResult.errors?.join(", ")}`,
        );
      }

      await this.monitoringService.trackValidationPassed(
        runtimeTest.testId,
        validationDuration,
      );

      // 3. Monitor Success
      const buildDuration = Date.now() - startTime;
      await this.monitoringService.trackBuildCompleted(
        runtimeTest.testId,
        buildDuration,
      );

      return runtimeTest;
    } catch (error: any) {
      // Monitor Failure
      const buildDuration = Date.now() - startTime;
      await this.monitoringService.trackBuildFailed(
        packagedTest.assemblyId,
        error.message,
        buildDuration,
      );
      this.logger.error(
        `Failed to generate runtime: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
