import { Module } from "@nestjs/common";
import { DashboardController } from "./controllers/dashboard.controller";
import { AdminDashboardController } from "./controllers/admin-dashboard.controller";
import { DashboardService } from "./services/dashboard.service";
import { AdminDashboardService } from "./services/admin-dashboard.service";
import { DashboardRepository } from "./repositories/dashboard.repository";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController, AdminDashboardController],
  providers: [DashboardService, AdminDashboardService, DashboardRepository],
  exports: [DashboardService, AdminDashboardService, DashboardRepository],
})
export class DashboardModule {}
