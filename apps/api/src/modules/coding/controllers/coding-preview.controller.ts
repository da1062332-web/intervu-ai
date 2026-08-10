import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { PreviewService } from "../services/preview.service";
import { PreviewCodingPatternDto } from "../dto/preview-coding-pattern.dto";
import { PatternPreviewResponseDto } from "../dto/pattern-preview-response.dto";

@ApiTags("coding-patterns")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("coding-patterns")
export class CodingPreviewController {
  constructor(private readonly previewService: PreviewService) {}

  @Post("preview")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate in-memory preview of a Coding Pattern" })
  async preview(
    @Body() dto: PreviewCodingPatternDto,
  ): Promise<PatternPreviewResponseDto> {
    return this.previewService.generatePreview(dto);
  }
}
