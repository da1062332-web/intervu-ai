import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { PublicTestsService } from "../services/public-tests.service";
import { PublicTestsQueryDto } from "../dto/public-tests-query.dto";

@ApiTags("tests")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CANDIDATE)
@Controller("candidate/tests")
export class PublicTestsController {
  constructor(private readonly publicTestsService: PublicTestsService) {}

  @Get()
  @ApiOperation({ summary: "Get paginated, filterable public test catalog" })
  async getPublicTests(@Query() query: PublicTestsQueryDto) {
    return this.publicTestsService.getPublicTests(query);
  }
}
