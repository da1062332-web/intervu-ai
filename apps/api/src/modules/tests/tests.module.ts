import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { TestsController } from "./controllers/tests.controller";
import { TestsService } from "./services/tests.service";
import { TestsRepository } from "./repositories/tests.repository";
import { StartTestModule } from "./start-test/start-test.module";
import { CandidateModule } from "../candidate/candidate.module";

@Module({
  imports: [PrismaModule, StartTestModule, forwardRef(() => CandidateModule)],
  controllers: [TestsController],
  providers: [TestsService, TestsRepository],
  exports: [TestsService],
})
export class TestsModule {}
