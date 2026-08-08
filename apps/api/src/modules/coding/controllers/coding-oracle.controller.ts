import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { UserRole, DifficultyLevel } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import {
  CodingOracleService,
  CreateCodingOracleDto,
  UpdateCodingOracleDto,
} from "../services/coding-oracle.service";
import { PreviewService } from "../services/preview.service";

@ApiTags("coding-oracles")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("coding-oracles")
export class CodingOracleController {
  constructor(
    private readonly oracleService: CodingOracleService,
    private readonly previewService: PreviewService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List all Coding Oracles with filtering and search" })
  @ApiQuery({ name: "category", type: String, required: false })
  @ApiQuery({ name: "isActive", type: Boolean, required: false })
  @ApiQuery({ name: "search", type: String, required: false })
  @ApiQuery({ name: "page", type: Number, required: false })
  @ApiQuery({ name: "limit", type: Number, required: false })
  async findAll(
    @Query("category") category?: string,
    @Query("isActive") isActive?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.oracleService.getAllOracles({
      category,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post("sync")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Manually trigger synchronization of backend Oracles with Database" })
  async sync() {
    return this.oracleService.syncOraclesWithRegistry();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a Coding Oracle record by ID or Key" })
  async findOne(@Param("id") id: string) {
    return this.oracleService.getOracleByIdOrKey(id);
  }

  @Post(":id/test")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Execute and test an Oracle in memory (Playground)" })
  async testOracle(
    @Param("id") id: string,
    @Body() body: { parameterSchema?: Record<string, any>; seed?: number; difficulty?: string },
  ) {
    const oracle = await this.oracleService.getOracleByIdOrKey(id);
    return this.previewService.generatePreview({
      oracleKey: oracle.key,
      parameterSchema: body.parameterSchema || (oracle.parameterSchema as Record<string, any>),
      difficulty: (body.difficulty as DifficultyLevel) || DifficultyLevel.MEDIUM,
      seed: body.seed,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new Coding Oracle definition record" })
  async create(@Body() dto: CreateCodingOracleDto) {
    return this.oracleService.createOracle(dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a Coding Oracle record by ID or Key" })
  async update(@Param("id") id: string, @Body() dto: UpdateCodingOracleDto) {
    return this.oracleService.updateOracle(id, dto);
  }

  @Patch(":id/toggle")
  @ApiOperation({ summary: "Toggle active status of a Coding Oracle" })
  async toggle(@Param("id") id: string) {
    return this.oracleService.toggleOracleStatus(id);
  }
}
