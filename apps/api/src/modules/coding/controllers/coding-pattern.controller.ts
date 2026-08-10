import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CodingPatternStatus, DifficultyLevel, UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { CodingPatternService } from "../services/coding-pattern.service";
import { OracleRegistry } from "../oracles/oracle.registry";
import { CreateCodingPatternDto } from "../dto/create-coding-pattern.dto";
import { UpdateCodingPatternDto } from "../dto/update-coding-pattern.dto";

@ApiTags("coding-patterns")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("coding-patterns")
export class CodingPatternController {
  constructor(
    private readonly patternService: CodingPatternService,
    private readonly oracleRegistry: OracleRegistry,
  ) {}

  @Get("oracles")
  @ApiOperation({ summary: "Get all registered Oracle metadata dynamically" })
  async getOracles() {
    return this.oracleRegistry.getAllMetadata();
  }

  @Get("oracles/validate/:key")
  @ApiOperation({ summary: "Validate an Oracle key against backend registry" })
  async validateOracleKey(@Param("key") key: string) {
    if (!this.oracleRegistry.hasOracle(key)) {
      throw new NotFoundException(`Oracle key "${key}" is not registered in the OracleRegistry.`);
    }
    return {
      valid: true,
      key,
      metadata: this.oracleRegistry.getMetadataByKey(key),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new coding pattern" })
  async create(@Body() dto: CreateCodingPatternDto) {
    return this.patternService.createPattern(dto);
  }

  @Get()
  @ApiOperation({ summary: "List all coding patterns with filtering and pagination" })
  @ApiQuery({ name: "status", enum: CodingPatternStatus, required: false })
  @ApiQuery({ name: "difficulty", enum: DifficultyLevel, required: false })
  @ApiQuery({ name: "oracleKey", type: String, required: false })
  @ApiQuery({ name: "search", type: String, required: false })
  @ApiQuery({ name: "page", type: Number, required: false })
  @ApiQuery({ name: "limit", type: Number, required: false })
  async findAll(
    @Query("status") status?: CodingPatternStatus,
    @Query("difficulty") difficulty?: DifficultyLevel,
    @Query("oracleKey") oracleKey?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.patternService.getAllPatterns({
      status,
      difficulty,
      oracleKey,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a coding pattern by ID" })
  async findOne(@Param("id") id: string) {
    return this.patternService.getPatternById(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a coding pattern by ID" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateCodingPatternDto,
  ) {
    return this.patternService.updatePattern(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete a coding pattern by ID" })
  async remove(@Param("id") id: string) {
    return this.patternService.deletePattern(id);
  }
}
