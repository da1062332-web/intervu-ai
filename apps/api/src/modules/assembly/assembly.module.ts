import { Module } from "@nestjs/common";
import { AssemblyController } from "./assembly.controller";
import { AssemblyService } from "./assembly.service";
import { BlueprintBuilderService } from "./blueprint-builder.service";
import { QuestionAllocatorService } from "./question-allocator.service";
import { SectionBuilderService } from "./section-builder.service";
import { AssemblyValidatorService } from "./assembly-validator.service";
import { AssemblyRepository } from "./assembly.repository";
import { PrismaModule } from "../../prisma/prisma.module";
import { QuestionPoolModule } from "../question-pool/question-pool.module";
import { TestConfigRepository } from "../tests/repositories/test-config.repository";

@Module({
  imports: [PrismaModule, QuestionPoolModule],
  controllers: [AssemblyController],
  providers: [
    AssemblyService,
    BlueprintBuilderService,
    QuestionAllocatorService,
    SectionBuilderService,
    AssemblyValidatorService,
    AssemblyRepository,
    TestConfigRepository,
  ],
  exports: [AssemblyService],
})
export class AssemblyModule {}
