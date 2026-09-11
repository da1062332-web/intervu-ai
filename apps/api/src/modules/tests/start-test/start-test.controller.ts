import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { StartTestService } from "./start-test.service";
import { StartTestDto } from "./dto/start-test.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("tests")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.CANDIDATE)
@Controller({ path: "tests", version: "1" })
export class StartTestController {
  constructor(private readonly startTestService: StartTestService) {}

  @Post("start")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Start a new test assessment" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Test instance created successfully.",
    schema: {
      example: {
        success: true,
        data: {
          testInstanceId: "uuid",
          status: "CREATED",
          instructionsUrl: "/test/uuid/instructions",
          durationSeconds: 5400,
        },
        error: null,
        meta: {},
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "User not eligible or config not found.",
    schema: {
      example: {
        success: false,
        data: null,
        error: {
          code: "USER_NOT_ELIGIBLE",
          message: "User does not exist or is inactive",
        },
        meta: {},
      },
    },
  })
  async startTest(
    @Req() req: Request & { user?: { id: string } },
    @Body() input: StartTestDto,
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException("Unauthorized");
    }
    const userId = req.user.id;
    return await this.startTestService.startTest(userId, input);
  }
}
