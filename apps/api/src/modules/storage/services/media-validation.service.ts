import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { AppConfigService } from '../../../config/config.service';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const MAGIC_BYTES: Record<string, number[][]> = {
  'image/png':  [[0x89, 0x50, 0x4e, 0x47]],
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

function parseDimensionsFromBuffer(
  buffer: Buffer,
  mimeType: string,
): { width: number; height: number } {
  try {
    if (mimeType === 'image/png' && buffer.length >= 24) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      if (width > 0 && height > 0) return { width, height };
    }

    if (mimeType === 'image/jpeg' && buffer.length >= 4) {
      let offset = 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1];
        if (
          marker === 0xc0 ||
          marker === 0xc1 ||
          marker === 0xc2 ||
          marker === 0xc3
        ) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          if (width > 0 && height > 0) return { width, height };
        }
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }

    if (mimeType === 'image/webp' && buffer.length >= 30) {
      const format = buffer.toString('ascii', 12, 16);
      if (format === 'VP8X' && buffer.length >= 30) {
        const width = 1 + buffer.readUIntLE(24, 3);
        const height = 1 + buffer.readUIntLE(27, 3);
        if (width > 0 && height > 0) return { width, height };
      }
      if (format === 'VP8 ' && buffer.length >= 30) {
        const width = buffer.readUInt16LE(26) & 0x3fff;
        const height = buffer.readUInt16LE(28) & 0x3fff;
        if (width > 0 && height > 0) return { width, height };
      }
      if (format === 'VP8L' && buffer.length >= 25) {
        const b0 = buffer[21];
        const b1 = buffer[22];
        const b2 = buffer[23];
        const b3 = buffer[24];
        const width = 1 + (((b1 & 0x3f) << 8) | b0);
        const height = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
        if (width > 0 && height > 0) return { width, height };
      }
    }
  } catch {
    // If parsing fails, return fallback
  }

  return { width: 400, height: 400 };
}

@Injectable()
export class MediaValidationService {
  constructor(private readonly config: AppConfigService) {}

  private get maxBytes(): number {
    const mb = this.config.maxImageSizeMb ?? 5;
    return Number(mb) * 1024 * 1024;
  }

  validateMimeType(mimeType: string): void {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `Unsupported file type "${mimeType}". Allowed: PNG, JPEG, WebP.`,
      );
    }
  }

  validateMagicBytes(buffer: Buffer, mimeType: string): void {
    const signatures = MAGIC_BYTES[mimeType];
    if (!signatures) return;
    const matches = signatures.some((sig) =>
      sig.every((byte, i) => buffer[i] === byte),
    );
    if (!matches) {
      throw new BadRequestException(
        'File content does not match the declared file type.',
      );
    }
  }

  validateSize(sizeBytes: number): void {
    if (sizeBytes > this.maxBytes) {
      const mb = (sizeBytes / 1024 / 1024).toFixed(1);
      const max = this.config.maxImageSizeMb ?? 5;
      throw new BadRequestException(
        `File size ${mb} MB exceeds the maximum allowed size of ${max} MB.`,
      );
    }
  }

  async validateAndGetDimensions(
    buffer: Buffer,
    mimeType = 'image/png',
  ): Promise<{ width: number; height: number }> {
    const { width, height } = parseDimensionsFromBuffer(buffer, mimeType);

    if (width < 100 || height < 100) {
      throw new BadRequestException(
        `Image is too small (${width}x${height}px). Minimum is 100x100px.`,
      );
    }
    if (width > 4000 || height > 4000) {
      throw new BadRequestException(
        `Image is too large (${width}x${height}px). Maximum is 4000x4000px.`,
      );
    }
    return { width, height };
  }

  /**
   * Validates that all provided mediaIds exist and are ACTIVE.
   * Pass a Prisma transaction client when calling inside a transaction.
   */
  async validateMediaIds(
    ids: (string | null | undefined)[],
    prismaClient: any,
  ): Promise<void> {
    const validIds = ids.filter((id): id is string => !!id);
    if (validIds.length === 0) return;

    const found = await prismaClient.mediaAsset.findMany({
      where: { id: { in: validIds }, status: 'ACTIVE' },
      select: { id: true },
    });

    const foundIds = new Set(found.map((a: any) => a.id));
    const missing = validIds.filter((id) => !foundIds.has(id));

    if (missing.length > 0) {
      throw new BadRequestException(
        `Media asset(s) not found or not active: ${missing.join(', ')}`,
      );
    }
  }
}
