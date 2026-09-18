import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MediaStorageService } from './media-storage.service';
import { MediaValidationService } from './media-validation.service';
import { MediaAssetDto, ListMediaQueryDto, PaginatedMediaDto } from '../dto/media.dto';
import { MediaAsset, MediaStatus, MediaType } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class MediaAssetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: MediaStorageService,
    private readonly validationService: MediaValidationService,
  ) {}

  async uploadImage(
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    altText: string | undefined,
    createdById: string,
  ): Promise<MediaAssetDto> {
    this.validationService.validateMimeType(file.mimetype);
    this.validationService.validateMagicBytes(file.buffer, file.mimetype);
    this.validationService.validateSize(file.size);

    const { width, height } = await this.validationService.validateAndGetDimensions(
      file.buffer,
      file.mimetype,
    );

    const ext = file.originalname.split('.').pop() || 'png';
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const assetId = createId();
    const storageKey = `${year}/${month}/${assetId}.${ext}`;

    await this.storageService.upload(storageKey, file.buffer, file.mimetype);

    const mediaAsset = await this.prisma.mediaAsset.create({
      data: {
        id: assetId,
        type: MediaType.IMAGE,
        fileName: file.originalname,
        storageKey,
        mimeType: file.mimetype,
        fileSize: BigInt(file.size),
        width,
        height,
        altText: altText || null,
        status: MediaStatus.ACTIVE,
        createdById,
      },
    });

    return this.mapToDto(mediaAsset);
  }

  async list(query: ListMediaQueryDto): Promise<PaginatedMediaDto> {
    const rawPage = Number(query.page);
    const page = !isNaN(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;

    const rawLimit = Number(query.limit);
    const parsedLimit = !isNaN(rawLimit) && rawLimit >= 1 ? Math.floor(rawLimit) : 20;
    const limit = Math.min(parsedLimit, 100);

    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status as MediaStatus;
    } else {
      where.status = MediaStatus.ACTIVE;
    }

    if (query.search) {
      where.OR = [
        { fileName: { contains: query.search, mode: 'insensitive' } },
        { altText: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);

    return {
      items: items.map((asset) => this.mapToDto(asset)),
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<MediaAssetDto> {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id },
    });

    if (!asset) {
      throw new NotFoundException(`Media asset with ID "${id}" not found.`);
    }

    return this.mapToDto(asset);
  }

  async archive(id: string): Promise<void> {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id },
    });

    if (!asset) {
      throw new NotFoundException(`Media asset with ID "${id}" not found.`);
    }

    await this.prisma.mediaAsset.update({
      where: { id },
      data: { status: MediaStatus.ARCHIVED },
    });
  }

  resolveUrl(storageKey: string): string {
    return this.storageService.getPublicUrl(storageKey);
  }

  mapToDto(asset: MediaAsset): MediaAssetDto {
    return {
      id: asset.id,
      type: asset.type,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      fileSize: Number(asset.fileSize),
      width: asset.width ?? undefined,
      height: asset.height ?? undefined,
      altText: asset.altText ?? undefined,
      status: asset.status,
      url: this.resolveUrl(asset.storageKey),
      createdAt: asset.createdAt.toISOString(),
    };
  }
}
