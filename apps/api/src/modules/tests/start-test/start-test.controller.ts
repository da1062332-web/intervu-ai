import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  HttpException,
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

@ApiTags("tests")
@Controller({ path: "tests", version: "1" })
export class StartTestController {
  constructor(private readonly startTestService: StartTestService) {}

  @Post("start")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
    try {
      if (!req.user || !req.user.id) {
        throw new Error("Unauthorized");
      }
      const userId = req.user.id;
      const data = await this.startTestService.startTest(userId, input);
      return { success: true, data, error: null, meta: {} };
    } catch (error) {
      let code = "TEST_CREATION_FAILED";
      let message = "Failed to start test";

      if (error instanceof HttpException) {
        const response = error.getResponse();
        if (response && typeof response === "object" && "code" in response) {
          code = (response as { code: string }).code;
          message = (response as { message?: string }).message || message;
        } else if (
          response &&
          typeof response === "object" &&
          "message" in response
        ) {
          const resMsg = (response as { message: string | string[] }).message;
          message = Array.isArray(resMsg) ? resMsg.join(", ") : resMsg;
          code = (response as { error?: string }).error || "BAD_REQUEST";
        }
      } else if (error instanceof Error) {
        if (error.message === "Unauthorized") {
          code = "UNAUTHORIZED";
          message = "Unauthorized request";
        } else {
          message = error.message;
          code = error.name;
        }
      }

      return {
        success: false,
        data: null,
        error: { code, message },
        meta: {},
      };
    }
  }
}
