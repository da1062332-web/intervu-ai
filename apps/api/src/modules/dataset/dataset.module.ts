import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { DatasetController } from "./controllers/dataset.controller";
import { DatasetService } from "./services/dataset.service";

@Module({
  imports: [PrismaModule],
  controllers: [DatasetController],
  providers: [DatasetService],
  exports: [DatasetService],
})
export class DatasetModule {}
