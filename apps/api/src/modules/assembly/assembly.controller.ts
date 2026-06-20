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
import { AssemblyService } from "./assembly.service";
import { CreateAssemblyDto } from "./dto/create-assembly.dto";
import {
  AssemblyBuildResponseDto,
  AssemblyGetResponseDto,
} from "./dto/assembly-response.dto";
import {
  TestInstanceSection,
  TestInstanceQuestion,
  UserRole,
} from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../auth/decorators/roles.decorator";

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

  @Post("build")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Build a new Test Instance from a Config" })
  @ApiResponse({ status: 201, type: AssemblyBuildResponseDto })
  async buildAssembly(
    @Body() dto: CreateAssemblyDto,
  ): Promise<AssemblyBuildResponseDto> {
    const testInstanceId = await this.assemblyService.assembleTest(
      dto.configId,
    );

    return {
      success: true,
      data: { testInstanceId },
      error: null,
      meta: null,
    };
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.CANDIDATE)
  @ApiOperation({ summary: "Get an assembled Test Instance" })
  @ApiResponse({ status: 200, type: AssemblyGetResponseDto })
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
