import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MediaAssetDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: 'IMAGE' }) type!: string;
  @ApiProperty() fileName!: string;
  @ApiProperty() mimeType!: string;
  @ApiProperty() fileSize!: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() altText?: string;
  @ApiProperty({ example: 'ACTIVE' }) status!: string;
  @ApiProperty() url!: string;
  @ApiProperty() createdAt!: string;
}

export class UploadImageDto {
  @ApiPropertyOptional({ example: 'A triangle diagram' })
  @IsString()
  @IsOptional()
  altText?: string;
}

export class ListMediaQueryDto {
  @ApiPropertyOptional({ enum: ['ACTIVE', 'ARCHIVED'] })
  @IsIn(['ACTIVE', 'ARCHIVED'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}

export interface PaginatedMediaDto {
  items: MediaAssetDto[];
  total: number;
  page: number;
  limit: number;
}
