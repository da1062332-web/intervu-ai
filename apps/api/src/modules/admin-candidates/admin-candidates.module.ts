import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { CandidateModule } from "../candidate/candidate.module";
import { ResultsModule } from "../results/results.module";
import { AdminCandidatesController } from "./admin-candidates.controller";
import { AdminCandidatesService } from "./admin-candidates.service";

@Module({
  imports: [PrismaModule, UsersModule, CandidateModule, ResultsModule],
  controllers: [AdminCandidatesController],
  providers: [AdminCandidatesService],
  exports: [AdminCandidatesService],
})
export class AdminCandidatesModule {}
