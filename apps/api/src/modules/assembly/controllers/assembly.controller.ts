import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AssemblyService } from "../services/test-assembly.service";
import { CreateAssemblyDto } from "@intervu/shared";
import {
  AssemblyBuildResponseDto,
  AssemblyGetResponseDto,
} from "@intervu/shared";
import {
  TestInstanceSection,
  TestInstanceQuestion,
  UserRole,
} from "@prisma/client";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";

type PopulatedSection = TestInstanceSection & {
  questions: TestInstanceQuestion[];
};

@ApiTags("Assembly Engine")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("assembly")
export class AssemblyController {
  constructor(private readonly assemblyService: AssemblyService) {}

  // --- NEW ROUTES ---
  @Post("tests/generate")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Build a new Test Instance from a Config" })
  @ApiResponse({ status: 201, type: AssemblyBuildResponseDto })
  async generateAssemblyNew(
    @Body() dto: CreateAssemblyDto,
    @CurrentUser() user: AuthUser,
  ): Promise<AssemblyBuildResponseDto> {
    const testInstanceId = await this.assemblyService.assembleTest(
      dto.configId,
      user.id,
    );

    return {
      success: true,
      data: { testInstanceId },
      error: null,
      meta: null,
    };
  }

  @Get("tests/:id/preview")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Dry-run preview of a Test Instance assembly" })
  @ApiResponse({ status: 200 })
  async previewAssemblyNew(
    @Param("id") configId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const preview = await this.assemblyService.previewTest(configId, user.id);
    return {
      success: true,
      data: preview,
      error: null,
      meta: null,
    };
  }

  @Post("tests/:id/validate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Validate an assembly configuration without throwing exceptions",
  })
  @ApiResponse({ status: 200 })
  async validateAssemblyNew(
    @Param("id") configId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const validation = await this.assemblyService.validateTest(
      configId,
      user.id,
    );
    return {
      success: true,
      data: validation,
      error: null,
      meta: null,
    };
  }

  // --- DEPRECATED ROUTES ---
  @Post("generate")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Build a new Test Instance from a Config",
    deprecated: true,
  })
  @ApiResponse({ status: 201, type: AssemblyBuildResponseDto })
  /** @deprecated Use /tests/generate instead */
  async generateAssembly(
    @Body() dto: CreateAssemblyDto,
    @CurrentUser() user: AuthUser,
  ): Promise<AssemblyBuildResponseDto> {
    return this.generateAssemblyNew(dto, user);
  }

  @Post("preview")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Dry-run preview of a Test Instance assembly",
    deprecated: true,
  })
  @ApiResponse({ status: 200 })
  /** @deprecated Use /tests/:id/preview instead */
  async previewAssembly(
    @Body() dto: CreateAssemblyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.previewAssemblyNew(dto.configId, user);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.CANDIDATE)
  @ApiOperation({ summary: "Get an assembled Test Instance", deprecated: true })
  @ApiResponse({ status: 200, type: AssemblyGetResponseDto })
  /** @deprecated */
  async getAssembly(@Param("id") id: string): Promise<AssemblyGetResponseDto> {
    const instance = await this.assemblyService.getAssembly(id);

    return {
      success: true,
      data: {
        id: instance.id,
        status: instance.status,
        sections: instance.sections.map((s: PopulatedSection) => ({
          sectionId: s.id,
          sectionName: s.sectionName,
          durationSeconds: s.durationSeconds,
          questions: s.questions.map((q) => ({
            questionId: q.questionId,
            questionOrder: q.questionOrder,
            questionSnapshot: q.questionSnapshot,
          })),
        })),
      },
      error: null,
      meta: null,
    };
  }
}
