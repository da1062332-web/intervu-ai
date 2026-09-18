import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { MediaAssetService } from '../services/media-asset.service';
import { UploadImageDto, ListMediaQueryDto } from '../dto/media.dto';

@ApiTags('media')
@ApiBearerAuth('jwt-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaAssetService: MediaAssetService) {}

  @Post('images')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image asset' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        altText: { type: 'string' },
      },
      required: ['file'],
    },
  })
  @ApiCreatedResponse({ description: 'Image uploaded successfully' })
  async uploadImage(
    @UploadedFile() file: any,
    @Body() dto: UploadImageDto,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided in request.');
    }

    const data = await this.mediaAssetService.uploadImage(
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      dto.altText,
      userId || 'admin',
    );

    return {
      success: true,
      data,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List media assets' })
  @ApiOkResponse({ description: 'Media assets retrieved successfully' })
  async list(@Query() query: ListMediaQueryDto) {
    const result = await this.mediaAssetService.list(query);
    return {
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single media asset by ID' })
  @ApiOkResponse({ description: 'Media asset retrieved successfully' })
  async findById(@Param('id') id: string) {
    const data = await this.mediaAssetService.findById(id);
    return {
      success: true,
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a media asset' })
  @ApiOkResponse({ description: 'Media asset archived successfully' })
  async archive(@Param('id') id: string) {
    await this.mediaAssetService.archive(id);
    return {
      success: true,
      message: 'Media asset archived successfully',
    };
  }
}
